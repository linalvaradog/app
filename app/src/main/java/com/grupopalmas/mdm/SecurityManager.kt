package com.palmas.mdm

import android.content.Context
import android.util.Log

object SecurityManager {

    private const val TAG = DeviceAdminReceiver.TAG
    private const val PREFS_NAME = "mdm_prefs"
    private const val KEY_PASSWORD = "admin_password"
    private const val DEFAULT_PASSWORD = "GrupopalmasTI2024"

    fun verificarPassword(context: Context, password: String): Boolean {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val guardada = prefs.getString(KEY_PASSWORD, DEFAULT_PASSWORD) ?: DEFAULT_PASSWORD
            password == guardada
        } catch (e: Exception) {
            Log.w(TAG, "Error al verificar contraseña: ${e.message}")
            password == DEFAULT_PASSWORD
        }
    }

    fun cambiarPassword(context: Context, nueva: String): Boolean {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_PASSWORD, nueva).apply()
            Log.d(TAG, "Contraseña actualizada correctamente")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Error al cambiar contraseña: ${e.message}")
            false
        }
    }

    fun detectarRoot(): Boolean {
        val rutasRoot = listOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        return rutasRoot.any { java.io.File(it).exists() }
    }

    fun detectarDepuracion(context: Context): Boolean {
        return android.os.Debug.isDebuggerConnected()
    }
}