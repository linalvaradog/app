package com.palmas.mdm

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object ActivityLogger {

    private const val TAG = DeviceAdminReceiver.TAG
    private const val LOG_FILE = "mdm_activity.log"
    private const val MAX_LINES = 500

    fun registrar(context: Context, evento: String) {
        try {
            val fecha = SimpleDateFormat(
                "dd/MM/yyyy HH:mm:ss",
                Locale.getDefault()
            ).format(Date())

            val linea = "[$fecha] $evento\n"
            val archivo = File(context.filesDir, LOG_FILE)

            FileWriter(archivo, true).use { it.write(linea) }
            Log.d(TAG, "Evento registrado: $evento")

            limpiarLogSiEsNecesario(archivo)
        } catch (e: Exception) {
            Log.w(TAG, "Error al registrar evento: ${e.message}")
        }
    }

    fun obtenerLog(context: Context): String {
        return try {
            val archivo = File(context.filesDir, LOG_FILE)
            if (archivo.exists()) {
                archivo.readText()
            } else {
                "Sin actividad registrada"
            }
        } catch (e: Exception) {
            "Error al leer el log"
        }
    }

    fun limpiarLog(context: Context) {
        try {
            val archivo = File(context.filesDir, LOG_FILE)
            if (archivo.exists()) archivo.delete()
            Log.d(TAG, "Log limpiado")
        } catch (e: Exception) {
            Log.w(TAG, "Error al limpiar log: ${e.message}")
        }
    }

    private fun limpiarLogSiEsNecesario(archivo: File) {
        try {
            val lineas = archivo.readLines()
            if (lineas.size > MAX_LINES) {
                val ultimas = lineas.takeLast(MAX_LINES)
                archivo.writeText(ultimas.joinToString("\n") + "\n")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error al limpiar log antiguo: ${e.message}")
        }
    }
}