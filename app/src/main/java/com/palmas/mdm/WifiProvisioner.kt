package com.palmas.mdm

import android.content.Context
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log

object WifiProvisioner {

    private const val TAG = DeviceAdminReceiver.TAG

    const val PREFS_WIFI = "mdm_wifi"
    const val KEY_WIFI_SSID = "wifi_ssid"
    const val KEY_WIFI_PASSWORD = "wifi_password"
    const val KEY_WIFI_SECURITY = "wifi_security"

    /**
     * Agrega y conecta una red WiFi como Device Owner.
     * Funciona en API 26–34: WifiManager.addNetwork() sigue siendo válido
     * para Device Owner aunque esté deprecado en API 29+.
     *
     * @param ssid nombre de la red (sin comillas)
     * @param password contraseña en texto plano
     * @param security "WPA2", "WPA" o "OPEN"
     */
    @Suppress("DEPRECATION")
    fun agregarRed(context: Context, ssid: String, password: String, security: String): Boolean {
        if (ssid.isBlank()) {
            Log.w(TAG, "WiFi: SSID vacío, ignorando")
            return false
        }

        guardarCredenciales(context, ssid, password, security)

        val wifiManager = context.applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        if (!wifiManager.isWifiEnabled) {
            wifiManager.isWifiEnabled = true
            Thread.sleep(1000)
        }

        val config = WifiConfiguration().apply {
            SSID = "\"$ssid\""
            when (security.uppercase()) {
                "OPEN" -> {
                    allowedKeyManagement.set(WifiConfiguration.KeyMgmt.NONE)
                }
                else -> {
                    preSharedKey = "\"$password\""
                    allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK)
                }
            }
            status = WifiConfiguration.Status.ENABLED
        }

        val existingId = wifiManager.configuredNetworks
            ?.firstOrNull { it.SSID == "\"$ssid\"" }?.networkId ?: -1

        val netId = if (existingId != -1) {
            config.networkId = existingId
            wifiManager.updateNetwork(config)
            existingId
        } else {
            wifiManager.addNetwork(config)
        }

        if (netId == -1) {
            Log.w(TAG, "WiFi: no se pudo agregar la red $ssid")
            ActivityLogger.registrar(context, "⚠️ No se pudo agregar red WiFi: $ssid")
            return false
        }

        wifiManager.disconnect()
        wifiManager.enableNetwork(netId, true)
        wifiManager.reconnect()

        Log.d(TAG, "WiFi: red $ssid configurada (netId=$netId)")
        ActivityLogger.registrar(context, "📶 Red WiFi configurada: $ssid")
        return true
    }

    fun guardarCredenciales(context: Context, ssid: String, password: String, security: String) {
        context.getSharedPreferences(PREFS_WIFI, Context.MODE_PRIVATE).edit()
            .putString(KEY_WIFI_SSID, ssid)
            .putString(KEY_WIFI_PASSWORD, password)
            .putString(KEY_WIFI_SECURITY, security)
            .apply()
    }

    fun obtenerCredenciales(context: Context): Triple<String, String, String> {
        val prefs = context.getSharedPreferences(PREFS_WIFI, Context.MODE_PRIVATE)
        return Triple(
            prefs.getString(KEY_WIFI_SSID, "") ?: "",
            prefs.getString(KEY_WIFI_PASSWORD, "") ?: "",
            prefs.getString(KEY_WIFI_SECURITY, "WPA2") ?: "WPA2"
        )
    }

    fun tieneCredenciales(context: Context): Boolean {
        val (ssid, _, _) = obtenerCredenciales(context)
        return ssid.isNotBlank()
    }
}
