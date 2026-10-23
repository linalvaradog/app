package com.grupopalmas.mdm

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.os.Bundle
import android.util.Log
import android.widget.TextView

/**
 * Se abre automáticamente al terminar el enrolamiento por QR.
 * Aquí confirmas al usuario que el dispositivo quedó configurado
 * y aplicas cualquier política adicional de primer arranque.
 */
class ProvisioningCompleteActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dpm = getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(this, DeviceAdminReceiver::class.java)

        // Aplicar políticas si aún no se aplicaron desde el receiver
        if (dpm.isDeviceOwnerApp(packageName)) {
            PolicyManager.applyAll(this)

            // Nombre visible del dispositivo en el MDM (puedes cambiarlo dinámicamente)
            dpm.setOrganizationName(admin, "Grupo Palmas")

            Log.d(DeviceAdminReceiver.TAG, "Dispositivo enrolado y configurado por Grupo Palmas MDM")
        }

        // UI mínima de confirmación
        // En el siguiente paso se reemplaza con tu layout XML
        val tv = TextView(this).apply {
            text = "✅ Dispositivo configurado\nGrupo Palmas MDM activo"
            textSize = 18f
            setPadding(48, 48, 48, 48)
        }
        setContentView(tv)

        // Cierra la actividad después de 3 segundos y lanza MainActivity
        tv.postDelayed({
            startActivity(android.content.Intent(this, MainActivity::class.java))
            finish()
        }, 3000)
    }
}