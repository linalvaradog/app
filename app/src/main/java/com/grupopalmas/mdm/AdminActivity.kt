package com.grupopalmas.mdm

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class AdminActivity : AppCompatActivity() {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    private val PREFS_SEDE = "mdm_sede"
    private val KEY_SEDE = "sede_nombre"
    private val KEY_NOMBRE = "colaborador_nombre"
    private val KEY_DNI = "colaborador_dni"
    private val KEY_AREA = "colaborador_area"
    private val KEY_PUESTO = "colaborador_puesto"

    private var autenticado = false

    private val sedes = arrayOf(
        "Seleccionar sede...",
        "Tulumayo",
        "Shanusi",
        "Palmawasi",
        "Nuevo Horizonte",
        "Lima"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin)

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)

        val etPassword           = findViewById<EditText>(R.id.etPassword)
        val btnAcceder           = findViewById<Button>(R.id.btnAcceder)
        val cardInstalacion      = findViewById<LinearLayout>(R.id.cardInstalacion)
        val cardApps             = findViewById<LinearLayout>(R.id.cardApps)
        val cardComandos         = findViewById<LinearLayout>(R.id.cardComandos)
        val cardSeguridad        = findViewById<LinearLayout>(R.id.cardSeguridad)
        val cardLog              = findViewById<LinearLayout>(R.id.cardLog)
        val btnPermitirApp       = findViewById<Button>(R.id.btnPermitirApp)
        val btnBloquearApp       = findViewById<Button>(R.id.btnBloquearApp)
        val btnOcultarPlayStore  = findViewById<Button>(R.id.btnOcultarPlayStore)
        val btnMostrarPlayStore  = findViewById<Button>(R.id.btnMostrarPlayStore)
        val btnLockDevice        = findViewById<Button>(R.id.btnLockDevice)
        val btnWipeDevice        = findViewById<Button>(R.id.btnWipeDevice)
        val btnRemoveDeviceOwner = findViewById<Button>(R.id.btnRemoveDeviceOwner)
        val tvEstadoInstalacion  = findViewById<TextView>(R.id.tvEstadoInstalacion)
        val etNuevaPassword      = findViewById<EditText>(R.id.etNuevaPassword)
        val btnCambiarPassword   = findViewById<Button>(R.id.btnCambiarPassword)
        val spinnerSede          = findViewById<Spinner>(R.id.spinnerSede)
        val etNombreColaborador  = findViewById<EditText>(R.id.etNombreColaborador)
        val etDNI                = findViewById<EditText>(R.id.etDNI)
        val etArea               = findViewById<EditText>(R.id.etArea)
        val etPuesto             = findViewById<EditText>(R.id.etPuesto)
        val btnGuardarSede       = findViewById<Button>(R.id.btnGuardarSede)
        val tvLog                = findViewById<TextView>(R.id.tvLog)
        val btnRefrescarLog      = findViewById<Button>(R.id.btnRefrescarLog)
        val btnLimpiarLog        = findViewById<Button>(R.id.btnLimpiarLog)

        // Configurar spinner de sedes
        val adapterSede = ArrayAdapter(this,
            android.R.layout.simple_spinner_item, sedes)
        adapterSede.setDropDownViewResource(
            android.R.layout.simple_spinner_dropdown_item)
        spinnerSede.adapter = adapterSede

        // Cargar datos guardados
        val prefs = getSharedPreferences(PREFS_SEDE, Context.MODE_PRIVATE)
        val sedeGuardada = prefs.getString(KEY_SEDE, "")
        val sedeIndex = sedes.indexOf(sedeGuardada)
        if (sedeIndex > 0) spinnerSede.setSelection(sedeIndex)

        etNombreColaborador.setText(prefs.getString(KEY_NOMBRE, ""))
        etDNI.setText(prefs.getString(KEY_DNI, ""))
        etArea.setText(prefs.getString(KEY_AREA, ""))
        etPuesto.setText(prefs.getString(KEY_PUESTO, ""))

        // ── AUTENTICACIÓN ──────────────────────────────────────
        btnAcceder.setOnClickListener {
            if (SecurityManager.verificarPassword(this, etPassword.text.toString())) {
                autenticado = true

                listOf(cardInstalacion, cardApps, cardComandos,
                    cardSeguridad, cardLog).forEach { it.alpha = 1.0f }

                listOf(btnPermitirApp, btnBloquearApp, btnOcultarPlayStore,
                    btnMostrarPlayStore, btnLockDevice, btnWipeDevice,
                    btnRemoveDeviceOwner, btnCambiarPassword, etNuevaPassword,
                    btnRefrescarLog, btnLimpiarLog, spinnerSede,
                    etNombreColaborador, etDNI, etArea, etPuesto,
                    btnGuardarSede).forEach { it.isEnabled = true }

                actualizarEstadoInstalacion(tvEstadoInstalacion)
                tvLog.text = ActivityLogger.obtenerLog(this)
                ActivityLogger.registrar(this, "🔑 Acceso al panel de administrador")
                Toast.makeText(this, "✅ Acceso concedido", Toast.LENGTH_SHORT).show()
                etPassword.text.clear()
            } else {
                ActivityLogger.registrar(this, "❌ Intento de acceso fallido al panel admin")
                Toast.makeText(this, "❌ Contraseña incorrecta", Toast.LENGTH_SHORT).show()
            }
        }

        // ── INSTALACIÓN DE APPS ────────────────────────────────
        btnPermitirApp.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isAdminActive(adminComponent)) {
                Toast.makeText(this, "⚠️ Sin permisos de administrador activos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            dpm.clearUserRestriction(adminComponent,
                android.os.UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
            PolicyManager.mostrarApp(this, "com.android.vending")
            actualizarEstadoInstalacion(tvEstadoInstalacion)
            ActivityLogger.registrar(this, "✅ Instalación permitida por administrador")
            Toast.makeText(this,
                "✅ Instalación permitida — Play Store habilitada",
                Toast.LENGTH_LONG).show()
        }

        btnBloquearApp.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isAdminActive(adminComponent)) {
                Toast.makeText(this, "⚠️ Sin permisos de administrador activos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            dpm.addUserRestriction(adminComponent,
                android.os.UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES)
            PolicyManager.ocultarApp(this, "com.android.vending")
            actualizarEstadoInstalacion(tvEstadoInstalacion)
            ActivityLogger.registrar(this, "🔒 Instalación bloqueada por administrador")
            Toast.makeText(this,
                "🔒 Instalación bloqueada — Play Store ocultada",
                Toast.LENGTH_SHORT).show()
        }

        // ── GESTIÓN DE APPS ────────────────────────────────────
        btnOcultarPlayStore.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isDeviceOwnerApp(packageName)) {
                Toast.makeText(this, "⚠️ Requiere Device Owner", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            PolicyManager.ocultarApp(this, "com.android.vending")
            ActivityLogger.registrar(this, "🙈 Play Store ocultada")
            Toast.makeText(this, "✅ Play Store ocultada", Toast.LENGTH_SHORT).show()
        }

        btnMostrarPlayStore.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isDeviceOwnerApp(packageName)) {
                Toast.makeText(this, "⚠️ Requiere Device Owner", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            PolicyManager.mostrarApp(this, "com.android.vending")
            ActivityLogger.registrar(this, "👁️ Play Store mostrada")
            Toast.makeText(this, "✅ Play Store visible", Toast.LENGTH_SHORT).show()
        }

        // ── COMANDOS REMOTOS ───────────────────────────────────
        btnLockDevice.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isAdminActive(adminComponent)) {
                Toast.makeText(this, "⚠️ Sin permisos de administrador activos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            ActivityLogger.registrar(this, "🔒 Pantalla bloqueada por administrador")
            dpm.lockNow()
        }

        btnWipeDevice.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            if (!dpm.isDeviceOwnerApp(packageName)) {
                Toast.makeText(this, "⚠️ Requiere Device Owner para borrado total", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AlertDialog.Builder(this)
                .setTitle("⚠️ Confirmar borrado total")
                .setMessage("Esta acción borrará TODOS los datos del dispositivo y no se puede deshacer. ¿Continuar?")
                .setPositiveButton("Sí, borrar todo") { _, _ ->
                    AlertDialog.Builder(this)
                        .setTitle("Última confirmación")
                        .setMessage("¿Estás completamente segura? El dispositivo se reiniciará a fábrica.")
                        .setPositiveButton("CONFIRMAR BORRADO") { _, _ ->
                            ActivityLogger.registrar(this, "⚠️ Borrado total ejecutado")
                            dpm.wipeData(0)
                        }
                        .setNegativeButton("Cancelar", null)
                        .show()
                }
                .setNegativeButton("Cancelar", null)
                .show()
        }

        btnRemoveDeviceOwner.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            AlertDialog.Builder(this)
                .setTitle("⚠️ Quitar Device Owner")
                .setMessage("Esto eliminará el control total del dispositivo. ¿Confirmas?")
                .setPositiveButton("Sí, quitar") { _, _ ->
                    try {
                        ActivityLogger.registrar(this, "🔓 Device Owner removido")
                        dpm.clearDeviceOwnerApp(packageName)
                        Toast.makeText(this,
                            "✅ Device Owner removido correctamente",
                            Toast.LENGTH_LONG).show()
                        finish()
                    } catch (e: Exception) {
                        Toast.makeText(this,
                            "Error: ${e.message}",
                            Toast.LENGTH_LONG).show()
                    }
                }
                .setNegativeButton("Cancelar", null)
                .show()
        }

        // ── CAMBIAR CONTRASEÑA ─────────────────────────────────
        btnCambiarPassword.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            val nueva = etNuevaPassword.text.toString().trim()
            if (nueva.length < 6) {
                Toast.makeText(this,
                    "⚠️ La contraseña debe tener al menos 6 caracteres",
                    Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            AlertDialog.Builder(this)
                .setTitle("Cambiar contraseña")
                .setMessage("¿Confirmas el cambio de contraseña?")
                .setPositiveButton("Confirmar") { _, _ ->
                    if (SecurityManager.cambiarPassword(this, nueva)) {
                        etNuevaPassword.text.clear()
                        ActivityLogger.registrar(this, "🔑 Contraseña de admin actualizada")
                        Toast.makeText(this,
                            "✅ Contraseña actualizada correctamente",
                            Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this,
                            "❌ Error al actualizar contraseña",
                            Toast.LENGTH_SHORT).show()
                    }
                }
                .setNegativeButton("Cancelar", null)
                .show()
        }

        // ── GUARDAR SEDE Y COLABORADOR ─────────────────────────
        btnGuardarSede.setOnClickListener {
            if (!autenticado) return@setOnClickListener

            val sedeSeleccionada = spinnerSede.selectedItem.toString()
            if (sedeSeleccionada == "Seleccionar sede...") {
                Toast.makeText(this,
                    "⚠️ Selecciona una sede",
                    Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val nombre = etNombreColaborador.text.toString().trim()
            val dni = etDNI.text.toString().trim()
            val area = etArea.text.toString().trim()
            val puesto = etPuesto.text.toString().trim()

            if (nombre.isEmpty() || dni.isEmpty() || area.isEmpty() || puesto.isEmpty()) {
                Toast.makeText(this,
                    "⚠️ Completa todos los datos del colaborador",
                    Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (dni.length != 8) {
                Toast.makeText(this,
                    "⚠️ El DNI debe tener 8 dígitos",
                    Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            getSharedPreferences(PREFS_SEDE, Context.MODE_PRIVATE).edit()
                .putString(KEY_SEDE, sedeSeleccionada)
                .putString(KEY_NOMBRE, nombre)
                .putString(KEY_DNI, dni)
                .putString(KEY_AREA, area)
                .putString(KEY_PUESTO, puesto)
                .apply()

            ActivityLogger.registrar(this,
                "💾 Dispositivo asignado — Sede: $sedeSeleccionada | " +
                        "Colaborador: $nombre | DNI: $dni | Área: $area | Puesto: $puesto")

            Toast.makeText(this,
                "✅ Datos guardados correctamente",
                Toast.LENGTH_SHORT).show()
        }

        // ── REGISTRO DE ACTIVIDAD ──────────────────────────────
        btnRefrescarLog.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            tvLog.text = ActivityLogger.obtenerLog(this)
            Toast.makeText(this, "✅ Log actualizado", Toast.LENGTH_SHORT).show()
        }

        btnLimpiarLog.setOnClickListener {
            if (!autenticado) return@setOnClickListener
            AlertDialog.Builder(this)
                .setTitle("Limpiar log")
                .setMessage("¿Confirmas limpiar todo el registro de actividad?")
                .setPositiveButton("Limpiar") { _, _ ->
                    ActivityLogger.limpiarLog(this)
                    tvLog.text = "Sin actividad registrada"
                    Toast.makeText(this, "✅ Log limpiado", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("Cancelar", null)
                .show()
        }
    }

    // ── FIX: verificar isAdminActive antes de llamar getUserRestrictions ──
    private fun actualizarEstadoInstalacion(tv: TextView) {
        try {
            if (!dpm.isAdminActive(adminComponent)) {
                tv.text = "Estado: ⚠️ Sin permisos de admin"
                tv.setTextColor(0xFFFFB74D.toInt()) // naranja
                return
            }
            val restricciones = dpm.getUserRestrictions(adminComponent)
            val bloqueada = restricciones.getBoolean(
                android.os.UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES, false)
            tv.text = if (bloqueada) "Estado: 🔒 Bloqueada" else "Estado: ✅ Permitida temporalmente"
            tv.setTextColor(if (bloqueada) 0xFFEF9A9A.toInt() else 0xFF81C784.toInt())
        } catch (e: SecurityException) {
            tv.text = "Estado: ⚠️ Sin permisos de admin"
            tv.setTextColor(0xFFFFB74D.toInt())
        }
    }
}