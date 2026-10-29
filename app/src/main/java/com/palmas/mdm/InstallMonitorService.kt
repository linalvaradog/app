package com.palmas.mdm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.telephony.TelephonyManager
import android.util.Log

class InstallMonitorService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private val CHANNEL_ID = "MDM_CHANNEL"
    private val TAG = "MDMService"

    // WakeLock para mantener el proceso activo
    private var wakeLock: PowerManager.WakeLock? = null

    private val installerPackages = listOf(
        "com.android.packageinstaller",
        "com.google.android.packageinstaller",
        "com.miui.global.packageinstaller",
        "com.samsung.android.packageinstaller"
    )

    // Monitor de instalaciones: reducido a cada 3s para no saturar el hilo principal
    private val monitorRunnable = object : Runnable {
        override fun run() {
            checkForInstaller()
            handler.postDelayed(this, 3_000)
        }
    }

    // Reconexión MQTT cada 60 segundos si se pierde
    private val mqttReconectRunnable = object : Runnable {
        override fun run() {
            if (!MqttManager.estaConectado()) {
                Log.d(TAG, "MQTT desconectado — reconectando...")
                val imei = obtenerImei()
                MqttManager.iniciar(this@InstallMonitorService, imei)
            }
            handler.postDelayed(this, 60_000)
        }
    }

    override fun onCreate() {
        super.onCreate()
        crearNotificacion()
        adquirirWakeLock()

        // Iniciar MQTT
        val imei = obtenerImei()
        MqttManager.iniciar(this, imei)

        // Iniciar monitoreo de instalaciones (cada 3s)
        handler.postDelayed(monitorRunnable, 3_000)

        // Iniciar reconexión periódica (empieza después de 60s)
        handler.postDelayed(mqttReconectRunnable, 60_000)

        ActivityLogger.registrar(this, "✅ Servicio MDM iniciado")
        Log.d(TAG, "Servicio MDM iniciado con IMEI: $imei")
    }

    private fun adquirirWakeLock() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "GrupopalmasMDM::ServiceWakeLock"
            ).also {
                it.acquire(10 * 60 * 1000L) // máx 10 minutos por adquisición (se renueva en onStartCommand)
            }
            Log.d(TAG, "WakeLock adquirido")
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo adquirir WakeLock: ${e.message}")
        }
    }

    private fun obtenerImei(): String {
        return try {
            val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    tm.imei ?: Build.SERIAL
                } else {
                    @Suppress("DEPRECATION")
                    tm.deviceId ?: Build.SERIAL
                }
            } else Build.SERIAL
        } catch (e: Exception) {
            Build.SERIAL
        }
    }

    private fun crearNotificacion() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Grupo Palmas MDM",
            NotificationManager.IMPORTANCE_LOW
        )
        channel.description = "Servicio de gestión de dispositivos corporativos"
        channel.setShowBadge(false)
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        val notification = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Grupo Palmas MDM activo")
            .setContentText("Dispositivo protegido y conectado")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }

    private fun checkForInstaller() {
        try {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE)
                    as UsageStatsManager
            val time = System.currentTimeMillis()
            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, time - 3000, time
            )

            stats?.maxByOrNull { it.lastTimeUsed }?.let { stat ->
                if (installerPackages.contains(stat.packageName) &&
                    stat.lastTimeUsed > time - 3000) {
                    ActivityLogger.registrar(this, "⚠️ Intento de instalación detectado — bloqueado")

                    val imei = obtenerImei()
                    MqttManager.reportarAlerta(
                        this, imei,
                        "instalacion",
                        "Intento de instalación detectado en ${Build.MANUFACTURER} ${Build.MODEL}"
                    )

                    mostrarPantallaBloqueo()
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error en checkForInstaller: ${e.message}")
        }
    }

    private fun mostrarPantallaBloqueo() {
        val intent = Intent(this, AdminActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra("MODO_BLOQUEO", true)
        }
        startActivity(intent)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Renovar WakeLock cada vez que el sistema reinicia el servicio
        if (wakeLock?.isHeld == false) {
            adquirirWakeLock()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        handler.removeCallbacks(monitorRunnable)
        handler.removeCallbacks(mqttReconectRunnable)
        MqttManager.detenerHeartbeat()

        // Liberar WakeLock
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        } catch (e: Exception) {
            Log.w(TAG, "Error liberando WakeLock: ${e.message}")
        }

        ActivityLogger.registrar(this, "🔴 Servicio MDM detenido")

        // Reiniciar el servicio automáticamente
        val restartIntent = Intent(this, InstallMonitorService::class.java)
        startForegroundService(restartIntent)

        super.onDestroy()
    }
}