package com.palmas.mdm

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.eclipse.paho.client.mqttv3.*
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import org.json.JSONObject

object MqttManager {

    private const val TAG = "MqttManager"
    private const val BROKER = "tcp://10.181.8.8:1883"
    private const val USERNAME = "mdm-device"
    private const val PASSWORD = "GrupopalmasMQTT2026"
    private const val HEARTBEAT_INTERVAL_MS = 30_000L  // cada 30 segundos

    @Volatile private var client: MqttClient? = null
    @Volatile private var conectando: Boolean = false
    private var imeiGuardado: String = ""

    // Handler en hilo principal para el heartbeat periódico
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private var heartbeatContext: Context? = null

    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            val ctx = heartbeatContext ?: return
            if (client?.isConnected == true) {
                publicarEstadoCompleto(ctx, imeiGuardado, "activo")
                Log.d(TAG, "💓 Heartbeat enviado")
            } else {
                Log.d(TAG, "💓 Heartbeat omitido — MQTT desconectado")
            }
            heartbeatHandler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
        }
    }

    fun iniciar(context: Context, imei: String) {
        imeiGuardado = imei
        heartbeatContext = context.applicationContext

        if (client?.isConnected == true) {
            Log.d(TAG, "MQTT ya conectado")
            return
        }

        if (conectando) {
            Log.d(TAG, "MQTT ya está conectando, ignorando llamada duplicada")
            return
        }

        conectando = true

        val thread = Thread {
            try {
                val clientId = "android-mdm-${imei.takeLast(6)}-${System.currentTimeMillis() % 10000}"
                Log.d(TAG, "Intentando conectar a $BROKER con clientId=$clientId")

                client = MqttClient(BROKER, clientId, MemoryPersistence())

                val options = MqttConnectOptions().apply {
                    userName = USERNAME
                    password = PASSWORD.toCharArray()
                    isCleanSession = true
                    connectionTimeout = 10
                    keepAliveInterval = 30
                    isAutomaticReconnect = false
                }

                client?.setCallback(object : MqttCallback {
                    override fun connectionLost(cause: Throwable?) {
                        Log.w(TAG, "Conexión perdida: ${cause?.message}")
                        ActivityLogger.registrar(context, "⚠️ Conexión MQTT perdida")
                        // Detener heartbeat hasta reconectar
                        heartbeatHandler.removeCallbacks(heartbeatRunnable)
                    }

                    override fun messageArrived(topic: String?, message: MqttMessage?) {
                        val payload = message?.toString() ?: return
                        procesarComando(context, payload)
                    }

                    override fun deliveryComplete(token: IMqttDeliveryToken?) {}
                })

                Log.d(TAG, "Ejecutando connect()...")
                client?.connect(options)
                Log.d(TAG, "✅ Conectado al broker MQTT")
                ActivityLogger.registrar(context, "✅ Conectado al servidor MDM")

                Thread.sleep(500)

                client?.subscribe("palmas/dispositivos/$imei/comando")
                Log.d(TAG, "Suscrito a comandos del dispositivo $imei")

                // Publicar estado inicial
                publicarEstadoCompleto(context, imei, "activo")

                // Iniciar heartbeat periódico
                heartbeatHandler.removeCallbacks(heartbeatRunnable)
                heartbeatHandler.postDelayed(heartbeatRunnable, HEARTBEAT_INTERVAL_MS)
                Log.d(TAG, "💓 Heartbeat iniciado cada ${HEARTBEAT_INTERVAL_MS / 1000}s")

            } catch (e: MqttException) {
                Log.w(TAG, "Error MQTT (código ${e.reasonCode}): ${e.message}")
                Log.w(TAG, "Stack: ${Log.getStackTraceString(e)}")
                ActivityLogger.registrar(context, "⚠️ Sin conexión al servidor MDM")
            } catch (e: Exception) {
                Log.w(TAG, "Error general: ${e.message}")
                Log.w(TAG, "Stack: ${Log.getStackTraceString(e)}")
                ActivityLogger.registrar(context, "⚠️ Sin conexión al servidor MDM")
            } finally {
                conectando = false
            }
        }
        thread.start()
    }

    private fun publicarEstadoCompleto(context: Context, imei: String, estado: String) {
        try {
            val prefs = context.getSharedPreferences("mdm_sede", Context.MODE_PRIVATE)
            val sede = prefs.getString("sede_nombre", "Sin sede configurada") ?: "Sin sede configurada"
            val nombre = prefs.getString("colaborador_nombre", "") ?: ""
            val dni = prefs.getString("colaborador_dni", "") ?: ""
            val area = prefs.getString("colaborador_area", "") ?: ""
            val puesto = prefs.getString("colaborador_puesto", "") ?: ""

            val json = JSONObject().apply {
                put("estado", estado)
                put("imei", imei)
                put("serial", try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        Build.getSerial()
                    else Build.SERIAL
                } catch (e: Exception) { "Desconocido" })
                put("modelo", Build.MODEL)
                put("fabricante", Build.MANUFACTURER)
                put("android", "Android ${Build.VERSION.RELEASE}")
                put("sede", sede)
                put("deviceOwner", true)
                put("timestamp", System.currentTimeMillis())

                if (nombre.isNotEmpty()) {
                    val colaborador = JSONObject().apply {
                        put("nombre", nombre)
                        put("dni", dni)
                        put("area", area)
                        put("puesto", puesto)
                    }
                    put("colaborador", colaborador)
                }
            }

            val msg = MqttMessage(json.toString().toByteArray()).apply { qos = 1 }
            client?.publish("palmas/dispositivos/$imei/estado", msg)
            Log.d(TAG, "Estado publicado: $estado")
        } catch (e: Exception) {
            Log.w(TAG, "Error publicando estado: ${e.message}")
        }
    }

    fun reportarAlerta(context: Context, imei: String, tipo: String, mensaje: String) {
        Thread {
            try {
                val json = JSONObject().apply {
                    put("tipo", tipo)
                    put("mensaje", mensaje)
                    put("imei", imei)
                    put("timestamp", System.currentTimeMillis())
                }
                val msg = MqttMessage(json.toString().toByteArray()).apply { qos = 1 }
                client?.publish("palmas/dispositivos/$imei/alerta", msg)
                Log.d(TAG, "Alerta publicada: $tipo")
            } catch (e: Exception) {
                Log.w(TAG, "Error publicando alerta: ${e.message}")
            }
        }.start()
    }

    private fun procesarComando(context: Context, payload: String) {
        try {
            val json = JSONObject(payload)
            val comando = json.getString("comando")
            ActivityLogger.registrar(context, "📡 Comando remoto: $comando")

            when (comando) {
                "lock" -> {
                    val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                            as android.app.admin.DevicePolicyManager
                    dpm.lockNow()
                    ActivityLogger.registrar(context, "🔒 Bloqueado remotamente")
                }
                "wipe" -> {
                    val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                            as android.app.admin.DevicePolicyManager
                    dpm.wipeData(0)
                }
                "refresh" -> {
                    PolicyManager.applyAll(context)
                    ActivityLogger.registrar(context, "🔄 Políticas sincronizadas")
                }
                "wifi_config" -> {
                    val ssid = json.optString("ssid", "")
                    val password = json.optString("password", "")
                    val security = json.optString("security", "WPA2")
                    if (ssid.isNotBlank()) {
                        Thread {
                            WifiProvisioner.agregarRed(context, ssid, password, security)
                        }.start()
                        ActivityLogger.registrar(context, "📶 Configuración WiFi recibida: $ssid")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error procesando comando: ${e.message}")
        }
    }

    fun detenerHeartbeat() {
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        Log.d(TAG, "💓 Heartbeat detenido")
    }

    fun desconectar() {
        detenerHeartbeat()
        try {
            client?.disconnect()
            client = null
        } catch (e: Exception) {
            Log.w(TAG, "Error desconectando: ${e.message}")
        }
    }

    fun estaConectado(): Boolean {
        return client?.isConnected == true
    }
}