package com.grupopalmas.mdm

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.UserManager
import android.util.Log

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

    private fun applyRestrictions(dpm: DevicePolicyManager, admin: ComponentName) {
        // Políticas base
        dpm.addUserRestriction(admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_UNINSTALL_APPS)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_FACTORY_RESET)

        // ISO 27001 / NIST CSF 2.0
        dpm.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_ADD_USER)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_DATE_TIME)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_DATA_ROAMING)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_SAFE_BOOT)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA)

        // dpm.addUserRestriction(admin, UserManager.DISALLOW_CONFIG_WIFI)  // no bloquear: se necesita para red corp
        // dpm.setCameraDisabled(admin, true)   // opcional por decisión de TI
        // dpm.setScreenCaptureDisabled(admin, true)

        Log.d(TAG, "Restricciones del sistema aplicadas (ISO27001/NIST)")
    }

    private fun applyPasswordPolicy(dpm: DevicePolicyManager, admin: ComponentName) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            dpm.setRequiredPasswordComplexity(DevicePolicyManager.PASSWORD_COMPLEXITY_MEDIUM)
        } else {
            @Suppress("DEPRECATION")
            dpm.setPasswordQuality(admin, DevicePolicyManager.PASSWORD_QUALITY_ALPHANUMERIC)
            @Suppress("DEPRECATION")
            dpm.setPasswordMinimumLength(admin, 6)
        }
        dpm.setMaximumTimeToLock(admin, 5 * 60 * 1000L)
        dpm.setMaximumFailedPasswordsForWipe(admin, 10)
        Log.d(TAG, "Política de contraseña aplicada (NIST MEDIUM)")
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