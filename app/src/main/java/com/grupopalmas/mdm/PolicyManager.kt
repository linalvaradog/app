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

    /**
     * Llamar justo después del provisioning (onProfileProvisioningComplete).
     * Con PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED=false Android deshabilita todo;
     * aquí habilitamos solo la lista blanca corporativa.
     */
    fun habilitarAppsPermitidas(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                as DevicePolicyManager
        val admin = ComponentName(context, DeviceAdminReceiver::class.java)

        if (!dpm.isDeviceOwnerApp(context.packageName)) return

        val permitidas = listOf(
            // --- Core AOSP ---
            "com.android.settings",
            "com.android.phone",
            "com.android.dialer",
            "com.android.contacts",
            "com.android.camera2",
            "com.android.gallery3d",
            "com.android.calculator2",
            "com.android.deskclock",
            "com.android.mms",
            "com.android.launcher3",
            "com.android.systemui",
            // Proveedores esenciales (sin estos las apps base no funcionan)
            "com.android.providers.contacts",
            "com.android.providers.telephony",
            "com.android.providers.media",
            "com.android.providers.media.module",
            "com.android.providers.downloads",
            "com.android.providers.calendar",
            "com.android.providers.settings",
            // Teclado
            "com.android.inputmethod.latin",
            "com.google.android.inputmethod.latin",
            // --- Google esencial ---
            "com.google.android.gms",          // Google Play Services (requerido)
            "com.google.android.gsf",           // Google Services Framework
            "com.android.vending",              // Play Store (para actualizaciones del MDM)
            // --- Samsung ---
            "com.sec.android.app.camera",
            "com.sec.android.gallery3d",
            "com.sec.android.app.calculator",
            "com.sec.android.app.clockpackage",
            "com.samsung.android.dialer",
            "com.samsung.android.contacts",
            "com.samsung.android.messaging",
            "com.samsung.android.app.launcher",
            "com.sec.android.app.launcher",
            "com.samsung.android.lool",
            // --- Navegador ---
            "com.android.chrome",
            "com.google.android.apps.chrome",
            // --- Motorola ---
            "com.motorola.camera2",
            "com.motorola.camera3",
            "com.motorola.gallery3d",
            "com.motorola.contacts",
            "com.motorola.dialer",
            "com.motorola.messaging",
            // --- Xiaomi / MIUI ---
            "com.miui.camera",
            "com.miui.gallery",
            "com.miui.calculator",
            "com.miui.clock",
            "com.miui.contacts",
            "com.android.contacts",             // AOSP contacts (Xiaomi/Moto)
            "com.miui.dialer",
            "com.android.dialer",               // AOSP dialer (Xiaomi/Moto)
            "com.miui.messaging",
            "com.android.mms",                  // AOSP SMS
            // --- MDM propio ---
            context.packageName
        )

        for (pkg in permitidas) {
            try {
                dpm.enableSystemApp(admin, pkg)
                Log.d(TAG, "App habilitada: $pkg")
            } catch (e: Exception) {
                Log.d(TAG, "No disponible en este dispositivo: $pkg")
            }
        }

        Log.d(TAG, "Lista blanca de apps aplicada (${permitidas.size} paquetes)")
    }

    private fun applyRestrictions(dpm: DevicePolicyManager, admin: ComponentName) {
        // Políticas base
        dpm.addUserRestriction(admin, UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_UNINSTALL_APPS)
        dpm.addUserRestriction(admin, UserManager.DISALLOW_FACTORY_RESET)

        // ISO 27001 / NIST CSF 2.0
        // DISALLOW_DEBUGGING_FEATURES desactivado: TI necesita ADB para desinstalar si la app falla
        // dpm.addUserRestriction(admin, UserManager.DISALLOW_DEBUGGING_FEATURES)
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