package com.grupopalmas.mdm

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.UserManager
import android.util.Log
import org.json.JSONObject

object PolicyManager {

    private const val TAG = DeviceAdminReceiver.TAG

    fun applyAll(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                as DevicePolicyManager
        val admin = ComponentName(context, DeviceAdminReceiver::class.java)

        if (!dpm.isDeviceOwnerApp(context.packageName)) {
            Log.w(TAG, "No somos Device Owner — políticas no aplicadas")
            return
        }

        applyRestrictions(dpm, admin)
        applyPasswordPolicy(dpm, admin)
        applyAppPolicy(context, dpm, admin)
        otorgarPermisos(context, dpm, admin)

        Log.d(TAG, "Todas las políticas aplicadas correctamente")
    }

    fun applyProfile(context: Context, perfil: JSONObject) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                as DevicePolicyManager
        val admin = ComponentName(context, DeviceAdminReceiver::class.java)

        if (!dpm.isDeviceOwnerApp(context.packageName)) {
            Log.w(TAG, "No somos Device Owner — perfil no aplicado")
            return
        }

        val appsOcultar = perfil.optJSONArray("apps_ocultar")
        if (appsOcultar != null) {
            for (i in 0 until appsOcultar.length()) {
                try { dpm.setApplicationHidden(admin, appsOcultar.getString(i), true) }
                catch (e: Exception) { Log.w(TAG, "No se pudo ocultar: ${e.message}") }
            }
        }

        val appsProteger = perfil.optJSONArray("apps_proteger")
        if (appsProteger != null) {
            for (i in 0 until appsProteger.length()) {
                try { dpm.setUninstallBlocked(admin, appsProteger.getString(i), true) }
                catch (e: Exception) { Log.w(TAG, "No se pudo proteger: ${e.message}") }
            }
        }

        val restricciones = perfil.optJSONObject("restricciones")
        if (restricciones != null) {
            if (restricciones.optBoolean("factory_reset", false))
                dpm.addUserRestriction(admin, UserManager.DISALLOW_FACTORY_RESET)
            if (restricciones.optBoolean("install_apps", false))
                dpm.addUserRestriction(admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
            if (restricciones.optBoolean("uninstall_apps", false))
                dpm.addUserRestriction(admin, UserManager.DISALLOW_UNINSTALL_APPS)
            if (restricciones.optBoolean("debug", false))
                dpm.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)
            if (restricciones.optBoolean("config_wifi", false))
                dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_WIFI)
        }

        val bloqueoMin = perfil.optInt("bloqueo_auto_minutos", 0)
        if (bloqueoMin > 0) {
            dpm.setMaximumTimeToLock(admin, bloqueoMin * 60 * 1000L)
        }

        Log.d(TAG, "Perfil aplicado: ${perfil.optString(\"nombre\")}")
    }

    private fun applyRestrictions(dpm: DevicePolicyManager, admin: ComponentName) {
        dpm.addUserRestriction(admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_UNINSTALL_APPS)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_FACTORY_RESET)

        // dpm.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_WIFI)
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_ADD_USER)
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_DATE_TIME)
        // dpm.setCameraDisabled(admin, true)
        // dpm.setScreenCaptureDisabled(admin, true)
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_BLUETOOTH)
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_DATA_ROAMING)

        Log.d(TAG, "Restricciones del sistema aplicadas")
    }

    private fun applyPasswordPolicy(dpm: DevicePolicyManager, admin: ComponentName) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            dpm.setRequiredPasswordComplexity(DevicePolicyManager.PASSWORD_COMPLEXITY_LOW)
        } else {
            @Suppress("DEPRECATION")
            dpm.setPasswordQuality(admin, DevicePolicyManager.PASSWORD_QUALITY_NUMERIC)
            @Suppress("DEPRECATION")
            dpm.setPasswordMinimumLength(admin, 6)
        }
        dpm.setMaximumTimeToLock(admin, 3 * 60 * 1000L)
        Log.d(TAG, "Política de contraseña aplicada")
    }

    private fun applyAppPolicy(
        context: Context,
        dpm: DevicePolicyManager,
        admin: ComponentName
    ) {
        val appsToHide = listOf(
            // Redes sociales
            "com.google.android.youtube",
            "com.facebook.katana",
            "com.facebook.appmanager",
            "com.facebook.services",
            "com.facebook.system",
            "com.facebook.orca",
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.whatsapp.w4b",
            "com.telegram.messenger",
            "com.snapchat.android",

            // Apps de Claro
            "com.dti.amx",
            "com.wssyncmldm",
            "com.wsomacp",
            "com.clarodrive.android",
            "com.claro.pe.miclaro",
            "com.claroColombia.contenedor",
            "com.mediatek.mdmconfig",
            "com.hiya.star",
            "com.claro.claromusica.latam",
            "com.telcelam.lockscreen",
            "com.dla.android",

            // Bloatware general
            "com.handmark.expressweather",
            "com.sec.android.app.kidshome",
            "com.samsung.android.game.gamehome",
            "com.samsung.sree",

            // Apps Samsung innecesarias
            "com.sec.android.app.fm",
            "com.sec.android.app.sbrowser",
            "com.sec.android.app.voicenote",
            "com.samsung.android.oneconnect",
            "com.sec.android.app.shealth",
            "com.samsung.android.app.watchmanager",
            "com.samsung.android.voc",
            "com.samsung.android.app.find",
            "com.samsung.android.app.reminder",
            "com.sec.android.easyMover",
            "com.sec.android.easyMover.Agent",
            "com.samsung.android.themestore",
            "com.samsung.android.app.galaxystore",
            "com.samsung.android.app.notes",
            "com.sec.android.app.samsungapps",
            "com.samsung.android.smartswitchassistant",
            "com.samsung.android.scloud",
            "com.samsung.android.app.dressroom",
            "com.samsung.android.stickercenter",
            "com.samsung.android.forest",
            "com.samsung.android.app.routines",
            "com.samsung.android.kidsinstaller",
            "com.samsung.knox.securefolder"
        )

        for (pkg in appsToHide) {
            try {
                dpm.setApplicationHidden(admin, pkg, true)
                Log.d(TAG, "App ocultada: $pkg")
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo ocultar $pkg: ${e.message}")
            }
        }

        val appsProtected = listOf(
            "com.microsoft.teams",
            "com.whatsapp",
            "com.microsoft.outlook",
            context.packageName
        )

        for (pkg in appsProtected) {
            try {
                dpm.setUninstallBlocked(admin, pkg, true)
                Log.d(TAG, "App protegida: $pkg")
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo proteger $pkg: ${e.message}")
            }
        }

        Log.d(TAG, "Políticas de apps aplicadas")
    }

    private fun otorgarPermisos(
        context: Context,
        dpm: DevicePolicyManager,
        admin: ComponentName
    ) {
        val permisos = listOf(
            android.Manifest.permission.READ_PHONE_STATE,
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.READ_CONTACTS
        )

        for (permiso in permisos) {
            try {
                dpm.setPermissionGrantState(
                    admin,
                    context.packageName,
                    permiso,
                    DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
                )
                Log.d(TAG, "Permiso otorgado: $permiso")
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo otorgar $permiso: ${e.message}")
            }
        }
        Log.d(TAG, "Permisos automáticos aplicados")
    }

    fun mostrarApp(context: Context, packageName: String) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                as DevicePolicyManager
        val admin = ComponentName(context, DeviceAdminReceiver::class.java)
        try {
            dpm.setApplicationHidden(admin, packageName, false)
            Log.d(TAG, "App mostrada: $packageName")
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo mostrar $packageName: ${e.message}")
        }
    }

    fun ocultarApp(context: Context, packageName: String) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                as DevicePolicyManager
        val admin = ComponentName(context, DeviceAdminReceiver::class.java)
        try {
            dpm.setApplicationHidden(admin, packageName, true)
            Log.d(TAG, "App ocultada: $packageName")
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo ocultar $packageName: ${e.message}")
        }
    }
}
