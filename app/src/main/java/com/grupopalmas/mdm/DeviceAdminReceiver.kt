package com.palmas.mdm

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
     * El QR usa PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED=false, así que
     * primero habilitamos solo las apps corporativas permitidas.
     */
    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "Provisioning completado — habilitando apps permitidas")
        PolicyManager.habilitarAppsPermitidas(context)
        Log.d(TAG, "Aplicando políticas de seguridad")
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