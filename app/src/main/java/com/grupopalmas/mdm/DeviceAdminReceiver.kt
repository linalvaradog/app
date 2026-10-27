package com.grupopalmas.mdm

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.os.PersistableBundle
import android.util.Log

class DeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        const val TAG = "GrupopalmasMDM"

        // Claves esperadas en el PROVISIONING_ADMIN_EXTRAS_BUNDLE del QR
        const val EXTRA_WIFI_SSID = "wifi_ssid"
        const val EXTRA_WIFI_PASSWORD = "wifi_password"
        const val EXTRA_WIFI_SECURITY = "wifi_security"
        const val EXTRA_SEDE = "sede"
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device Admin habilitado")
        PolicyManager.applyAll(context)
    }

    /**
     * Se llama cuando el enrolamiento por QR (Fully Managed) termina.
     * Lee las extras embebidas en el QR y configura WiFi y sede automáticamente.
     */
    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "Provisioning completado — aplicando políticas")
        PolicyManager.applyAll(context)

        // Leer extras del QR (PROVISIONING_ADMIN_EXTRAS_BUNDLE)
        val extras: PersistableBundle? = intent.getParcelableExtra(
            DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE
        )

        if (extras != null) {
            procesarExtrasQR(context, extras)
        } else {
            Log.d(TAG, "No se recibieron extras en el QR de enrolamiento")
        }

        val launch = Intent(context, ProvisioningCompleteActivity::class.java)
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launch)
    }

    private fun procesarExtrasQR(context: Context, extras: PersistableBundle) {
        val wifiSsid = extras.getString(EXTRA_WIFI_SSID, "")
        val wifiPassword = extras.getString(EXTRA_WIFI_PASSWORD, "")
        val wifiSecurity = extras.getString(EXTRA_WIFI_SECURITY, "WPA2")
        val sede = extras.getString(EXTRA_SEDE, "")

        Log.d(TAG, "Extras QR — SSID: $wifiSsid | Sede: $sede")

        // Guardar sede si viene en el QR
        if (!sede.isNullOrBlank()) {
            context.getSharedPreferences("mdm_sede", Context.MODE_PRIVATE)
                .edit()
                .putString("sede_nombre", sede)
                .apply()
            ActivityLogger.registrar(context, "📍 Sede asignada desde QR: $sede")
        }

        // Configurar WiFi si vienen credenciales en el QR
        if (!wifiSsid.isNullOrBlank()) {
            Thread {
                Thread.sleep(2000) // Esperar a que el sistema termine de arrancar
                WifiProvisioner.agregarRed(context, wifiSsid, wifiPassword ?: "", wifiSecurity ?: "WPA2")
            }.start()
        }
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device Admin deshabilitado")
    }
}
