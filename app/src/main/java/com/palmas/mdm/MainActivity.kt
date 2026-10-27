package com.palmas.mdm

import android.app.admin.DevicePolicyManager
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.telephony.TelephonyManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    private val PREFS_SEDE = "mdm_sede"
    private val KEY_SEDE = "sede_nombre"
    private val KEY_NOMBRE = "colaborador_nombre"
    private val KEY_DNI = "colaborador_dni"
    private val KEY_AREA = "colaborador_area"
    private val KEY_PUESTO = "colaborador_puesto"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)

        PolicyManager.applyAll(this)
        mostrarEstado()
        solicitarPermisoUsage()
        iniciarServicioMonitor()

        if (SecurityManager.detectarRoot()) {
            AlertDialog.Builder(this)
                .setTitle("⚠️ Dispositivo comprometido")
                .setMessage("Se detectó root en este dispositivo.")
                .setPositiveButton("Entendido", null)
                .show()
            ActivityLogger.registrar(this, "⚠️ Root detectado en el dispositivo")
        }

        if (SecurityManager.detectarDepuracion(this)) {
            ActivityLogger.registrar(this, "⚠️ Depuración detectada")
        }

        if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE)
            != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                arrayOf(android.Manifest.permission.READ_PHONE_STATE), 100
            )
        }

        // Iniciar MQTT
        val imei = try {
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
        } catch (e: Exception) { Build.SERIAL }

        MqttManager.iniciar(this, imei)

        findViewById<Button>(R.id.btnAdmin).setOnClickListener {
            startActivity(Intent(this, AdminActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        mostrarEstado()
    }

    override fun onDestroy() {
        super.onDestroy()
        // NO desconectar MQTT aquí — el InstallMonitorService mantiene la conexión activa
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 100) mostrarEstado()
    }

    private fun mostrarEstado() {
        val esDeviceOwner = dpm.isDeviceOwnerApp(packageName)
        val esDeviceAdmin = dpm.isAdminActive(adminComponent)

        val tvModoMDM = findViewById<TextView>(R.id.tvModoMDM)
        tvModoMDM.text = when {
            esDeviceOwner -> "● DEVICE OWNER"
            esDeviceAdmin -> "● ADMIN"
            else          -> "● INACTIVO"
        }
        tvModoMDM.setTextColor(when {
            esDeviceOwner -> 0xFF81C784.toInt()
            esDeviceAdmin -> 0xFFFFCC02.toInt()
            else          -> 0xFFEF9A9A.toInt()
        })

        findViewById<TextView>(R.id.tvEstadoMDM).text = when {
            esDeviceOwner -> "Device Owner (control total)"
            esDeviceAdmin -> "Device Admin (control básico)"
            else          -> "No activado"
        }

        findViewById<TextView>(R.id.tvModelo).text =
            "${Build.MANUFACTURER} ${Build.MODEL}"

        findViewById<TextView>(R.id.tvAndroid).text =
            "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"

        findViewById<TextView>(R.id.tvSerial).text =
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Build.getSerial()
                } else {
                    @Suppress("DEPRECATION")
                    Build.SERIAL
                }
            } catch (e: Exception) { "No disponible" }

        findViewById<TextView>(R.id.tvIMEI).text =
            try {
                val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                if (checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE)
                    == PackageManager.PERMISSION_GRANTED) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        tm.imei ?: "No disponible"
                    } else {
                        @Suppress("DEPRECATION")
                        tm.deviceId ?: "No disponible"
                    }
                } else "Permiso requerido"
            } catch (e: Exception) { "No disponible" }

        val prefs = getSharedPreferences(PREFS_SEDE, Context.MODE_PRIVATE)
        val sede = prefs.getString(KEY_SEDE, "Sin sede configurada")
        val nombre = prefs.getString(KEY_NOMBRE, "")
        val dni = prefs.getString(KEY_DNI, "")
        val area = prefs.getString(KEY_AREA, "")
        val puesto = prefs.getString(KEY_PUESTO, "")

        findViewById<TextView>(R.id.tvSede).text = "📍 $sede"

        val tvColaborador = findViewById<TextView>(R.id.tvColaborador)
        if (!nombre.isNullOrEmpty()) {
            tvColaborador.text = "👤 $nombre | DNI: $dni | $area — $puesto"
        } else {
            tvColaborador.text = "👤 Sin asignar"
        }

        val activo = if (esDeviceAdmin || esDeviceOwner) "🟢" else "🔴"

        findViewById<TextView>(R.id.tvPoliticaInstalacion).text =
            "$activo  Instalación de apps externas bloqueada"
        findViewById<TextView>(R.id.tvPoliticaReset).text =
            "$activo  Factory reset bloqueado"
        findViewById<TextView>(R.id.tvPoliticaUSB).text =
            "$activo  USB Debugging bloqueado"
        findViewById<TextView>(R.id.tvPoliticaPin).text =
            "$activo  PIN mínimo 6 dígitos requerido"
    }

    private fun solicitarPermisoUsage() {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val time = System.currentTimeMillis()
        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY, time - 1000, time
        )
        if (stats.isNullOrEmpty()) {
            Toast.makeText(this,
                "Activa el permiso de uso para que MDM funcione",
                Toast.LENGTH_LONG).show()
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
        }
    }

    private fun iniciarServicioMonitor() {
        val intent = Intent(this, InstallMonitorService::class.java)
        startForegroundService(intent)
    }
}