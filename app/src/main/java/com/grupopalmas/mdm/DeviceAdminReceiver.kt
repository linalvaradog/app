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
     * Se llama cuando el APK queda establecido como Device Admin.
     */
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d(TAG, "✅ Device Admin habilitado")
        ActivityLogger.registrar(context, "✅ Device Admin habilitado")
    }

    /**
     * Se llama cuando el enrolamiento por QR (Fully Managed) termina.
     * Aquí capturamos el token y lo validamos con el servidor.
     */
    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.d(TAG, "📱 Provisioning completado")
        ActivityLogger.registrar(context, "📱 Provisioning completado")

        // Capturar y validar el token del provisioning
        val token = intent.extras?.getString("token")
        if (!token.isNullOrEmpty()) {
            Log.d(TAG, "🔑 Token capturado: ${token.take(8)}...")
            EnrollmentManager.validarTokenConServidor(context, token)
        } else {
            Log.w(TAG, "⚠️ No se encontró token en el provisioning")
            ActivityLogger.registrar(context, "⚠️ Token no encontrado")
        }

        // Aplicar políticas si es Device Owner
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) 
            as android.app.admin.DevicePolicyManager
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            Log.d(TAG, "🔒 Dispositivo es Device Owner — aplicando políticas")
            PolicyManager.applyAll(context)
        } else {
            Log.d(TAG, "ℹ️ Dispositivo NO es Device Owner aún")
            ActivityLogger.registrar(context, "ℹ️ Aguardando configuración como Device Owner")
        }

        // Abrir pantalla de confirmación
        val launch = Intent(context, ProvisioningCompleteActivity::class.java)
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launch)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d(TAG, "❌ Device Admin deshabilitado")
        ActivityLogger.registrar(context, "❌ Device Admin deshabilitado")
    }
}
