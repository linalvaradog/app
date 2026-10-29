package com.palmas.mdm

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object EnrollmentManager {

    private const val TAG = "EnrollmentManager"
    private const val MDM_SERVER = "http://10.181.8.8:8084"

    /**
     * Valida el token de provisioning con el servidor MDM.
     * Se ejecuta en un hilo separado para no bloquear la UI.
     */
    fun validarTokenConServidor(context: Context, token: String) {
        Thread {
            try {
                val imei = obtenerIMEI(context)
                Log.d(TAG, "📡 Validando token con servidor: $MDM_SERVER/enrolamiento/validar")
                Log.d(TAG, "   Token: ${token.take(8)}...")
                Log.d(TAG, "   IMEI: $imei")

                val jsonPayload = JSONObject().apply {
                    put("token", token)
                    put("imei", imei)
                }

                val url = URL("$MDM_SERVER/enrolamiento/validar")
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    connectTimeout = 10000
                    readTimeout = 10000
                }

                // Enviar JSON
                connection.outputStream.use { os ->
                    os.write(jsonPayload.toString().toByteArray())
                    os.flush()
                }

                // Leer respuesta
                val statusCode = connection.responseCode
                val response = if (statusCode == HttpURLConnection.HTTP_OK) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                Log.d(TAG, "📡 Respuesta servidor: código $statusCode")

                // Procesar respuesta
                if (statusCode == HttpURLConnection.HTTP_OK) {
                    val respJson = JSONObject(response)
                    val esValido = respJson.optBoolean("valido", false)
                    val sede = respJson.optString("sede", "Sin sede")

                    if (esValido) {
                        Log.d(TAG, "✅ Token validado correctamente por el servidor")
                        ActivityLogger.registrar(context, "✅ Dispositivo enrolado — token validado")

                        // Guardar datos en SharedPreferences
                        val prefs = context.getSharedPreferences("mdm_sede", Context.MODE_PRIVATE)
                        prefs.edit().apply {
                            putString("sede_nombre", sede)
                            putBoolean("enrolado", true)
                            putString("enrollment_token", token)
                        }.apply()

                        // Iniciar MQTT en el hilo principal
                        Handler(Looper.getMainLooper()).post {
                            Log.d(TAG, "🚀 Iniciando MQTT")
                            MqttManager.iniciar(context, imei)
                        }
                    } else {
                        Log.w(TAG, "⚠️ Token rechazado por el servidor")
                        ActivityLogger.registrar(context, "⚠️ Enrolamiento rechazado — token inválido")
                    }
                } else {
                    Log.w(TAG, "⚠️ Error del servidor: código $statusCode")
                    ActivityLogger.registrar(context, "⚠️ Error del servidor: código $statusCode")
                }

                connection.disconnect()

            } catch (e: Exception) {
                Log.w(TAG, "❌ Excepción durante validación: ${e.message}")
                ActivityLogger.registrar(context, "❌ Error de validación: ${e.message}")
                e.printStackTrace()
            }
        }.start()
    }

    /**
     * Obtiene el IMEI del dispositivo de forma segura.
     */
    private fun obtenerIMEI(context: Context): String {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            
            // Verificar permiso READ_PHONE_STATE
            if (ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.READ_PHONE_STATE
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            ) {
                // Usar el método correcto según la versión de Android
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    tm.imei ?: Build.SERIAL
                } else {
                    @Suppress("DEPRECATION")
                    tm.deviceId ?: Build.SERIAL
                }
            } else {
                Log.w(TAG, "⚠️ Permiso READ_PHONE_STATE no otorgado, usando SERIAL")
                Build.SERIAL
            }
        } catch (e: Exception) {
            Log.w(TAG, "❌ Error obteniendo IMEI: ${e.message}, usando SERIAL")
            Build.SERIAL
        }
    }

    /**
     * Verifica si el dispositivo está enrolado correctamente.
     */
    fun estaEnrolado(context: Context): Boolean {
        val prefs = context.getSharedPreferences("mdm_sede", Context.MODE_PRIVATE)
        return prefs.getBoolean("enrolado", false)
    }

    /**
     * Obtiene la sede asignada al dispositivo.
     */
    fun obtenerSede(context: Context): String {
        val prefs = context.getSharedPreferences("mdm_sede", Context.MODE_PRIVATE)
        return prefs.getString("sede_nombre", "Sin sede") ?: "Sin sede"
    }
}
