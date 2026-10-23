package com.grupopalmas.mdm

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class DeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        const val TAG = "GrupopalmasMDM"
    }

    /**
     * Se llama cuando el APK queda establecido como Device Owner
     * (justo después del enrolamiento por QR).
     */
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "Device Admin habilitado")
        PolicyManager.applyAll(context)
    }

    /**
     * Se llama cuando el enrolamiento por QR (Fully Managed) termina.
     */
    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "Provisioning completado — aplicando políticas")
        PolicyManager.applyAll(context)

        // Abre la pantalla de confirmación al usuario
        val launch = Intent(context, ProvisioningCompleteActivity::class.java)
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launch)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "Device Admin deshabilitado")
    }
}