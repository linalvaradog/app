package com.grupopalmas.mdm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Build
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import android.util.Log

class WifiMonitorReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "WifiMonitor"
        val SSIDS_CORPORATIVOS = setOf("wifi_it", "Visitas_it", "wifi_bungalows")

        fun obtenerSsidActual(context: Context): String? {
            @Suppress("DEPRECATION")
            val wm = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            @Suppress("DEPRECATION")
            val info = wm.connectionInfo ?: return null
            @Suppress("DEPRECATION")
            val ssid = info.ssid?.removePrefix("\"")?.removeSuffix("\"") ?: return null
            return if (ssid == "<unknown ssid>" || ssid.isEmpty()) null else ssid
        }

        fun estaEnRedCorporativa(context: Context): Boolean {
            val ssid = obtenerSsidActual(context) ?: return false
            return ssid in SSIDS_CORPORATIVOS
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        val ssid = obtenerSsidActual(context)
        val enRedCorp = ssid != null && ssid in SSIDS_CORPORATIVOS

        val prefs = context.getSharedPreferences("mdm_wifi", Context.MODE_PRIVATE)
        val estabaConectado = prefs.getBoolean("wifi_conectado", false)

        if (enRedCorp && !estabaConectado) {
            prefs.edit().putBoolean("wifi_conectado", true).putString("ssid_actual", ssid).apply()
            Log.d(TAG, "Conectado a red corporativa: $ssid")
            ActivityLogger.registrar(context, "🟢 Conectado a red corporativa: $ssid")
            val imei = obtenerImei(context)
            MqttManager.iniciar(context, imei)
        } else if (!enRedCorp && estabaConectado) {
            prefs.edit().putBoolean("wifi_conectado", false).putString("ssid_actual", "").apply()
            Log.d(TAG, "Desconectado de red corporativa")
            ActivityLogger.registrar(context, "🔴 Fuera de red corporativa")
            MqttManager.desconectar()
        }
    }

    private fun obtenerImei(context: Context): String {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (context.checkSelfPermission(android.Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) tm.imei ?: Build.SERIAL
                else @Suppress("DEPRECATION") tm.deviceId ?: Build.SERIAL
            } else Build.SERIAL
        } catch (e: Exception) { Build.SERIAL }
    }
}
