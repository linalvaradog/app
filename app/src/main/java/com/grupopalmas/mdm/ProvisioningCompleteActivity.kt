package com.grupopalmas.mdm

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

class ProvisioningCompleteActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dpm = getSystemService(DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(this, DeviceAdminReceiver::class.java)

        if (dpm.isDeviceOwnerApp(packageName)) {
            PolicyManager.applyAll(this)
            dpm.setOrganizationName(admin, "Grupo Palmas")
            Log.d(DeviceAdminReceiver.TAG, "Dispositivo enrolado y configurado por Grupo Palmas MDM")
        }

        // Leer credenciales WiFi configuradas desde el QR
        val (wifiSsid, _, _) = WifiProvisioner.obtenerCredenciales(this)
        val sedeNombre = getSharedPreferences("mdm_sede", MODE_PRIVATE)
            .getString("sede_nombre", "") ?: ""

        // Construir UI de confirmación
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#1A1A2E"))
            setPadding(64, 64, 64, 64)
        }

        root.addView(TextView(this).apply {
            text = "✅"
            textSize = 56f
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = "Dispositivo configurado"
            textSize = 22f
            setTextColor(Color.parseColor("#81C784"))
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 8)
        })

        root.addView(TextView(this).apply {
            text = "Grupo Palmas MDM activo"
            textSize = 14f
            setTextColor(Color.parseColor("#B0BEC5"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        })

        if (sedeNombre.isNotBlank()) {
            root.addView(TextView(this).apply {
                text = "📍 Sede: $sedeNombre"
                textSize = 14f
                setTextColor(Color.parseColor("#90CAF9"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, 12)
            })
        }

        root.addView(TextView(this).apply {
            text = if (wifiSsid.isNotBlank())
                "📶 WiFi configurada: $wifiSsid"
            else
                "📶 Sin configuración WiFi en el QR"
            textSize = 14f
            setTextColor(
                if (wifiSsid.isNotBlank()) Color.parseColor("#A5D6A7")
                else Color.parseColor("#FFCC80")
            )
            gravity = Gravity.CENTER
        })

        setContentView(root)

        root.postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, 4000)
    }
}
