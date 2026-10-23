package com.grupopalmas.mdm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Se ejecuta cada vez que el dispositivo reinicia.
 * Reaaplica todas las políticas para que no se pierdan tras un reboot.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(DeviceAdminReceiver.TAG, "Boot detectado — reaplicando políticas")
            PolicyManager.applyAll(context)
        }
    }
}