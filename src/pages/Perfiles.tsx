import React, { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { Package, Plus, Edit2, Trash2, Save, X, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// ─── Apps conocidas ───────────────────────────────────────────────────────────
const APPS_CONOCIDAS = [
  { pkg: 'com.google.android.youtube',        nombre: 'YouTube',              cat: 'Redes sociales' },
  { pkg: 'com.facebook.katana',               nombre: 'Facebook',             cat: 'Redes sociales' },
  { pkg: 'com.instagram.android',             nombre: 'Instagram',            cat: 'Redes sociales' },
  { pkg: 'com.zhiliaoapp.musically',          nombre: 'TikTok',               cat: 'Redes sociales' },
  { pkg: 'com.whatsapp.w4b',                  nombre: 'WhatsApp Business',    cat: 'Redes sociales' },
  { pkg: 'com.telegram.messenger',            nombre: 'Telegram',             cat: 'Redes sociales' },
  { pkg: 'com.snapchat.android',              nombre: 'Snapchat',             cat: 'Redes sociales' },
  { pkg: 'com.dti.amx',                       nombre: 'Claro AMX',            cat: 'Bloatware Claro' },
  { pkg: 'com.claro.pe.miclaro',              nombre: 'Mi Claro',             cat: 'Bloatware Claro' },
  { pkg: 'com.claro.claromusica.latam',       nombre: 'Claro Música',   cat: 'Bloatware Claro' },
  { pkg: 'com.wssyncmldm',                    nombre: 'Claro DM Sync',        cat: 'Bloatware Claro' },
  { pkg: 'com.hiya.star',                     nombre: 'Hiya (Claro)',         cat: 'Bloatware Claro' },
  { pkg: 'com.sec.android.app.sbrowser',      nombre: 'Samsung Internet',     cat: 'Samsung' },
  { pkg: 'com.samsung.android.game.gamehome', nombre: 'Game Launcher',        cat: 'Samsung' },
  { pkg: 'com.sec.android.app.shealth',       nombre: 'Samsung Health',       cat: 'Samsung' },
  { pkg: 'com.samsung.android.themestore',    nombre: 'Galaxy Themes',        cat: 'Samsung' },
  { pkg: 'com.samsung.android.app.galaxystore', nombre: 'Galaxy Store',       cat: 'Samsung' },
  { pkg: 'com.samsung.android.scloud',        nombre: 'Samsung Cloud',        cat: 'Samsung' },
  { pkg: 'com.samsung.knox.securefolder',     nombre: 'Secure Folder',        cat: 'Samsung' },
  { pkg: 'com.sec.android.easyMover',         nombre: 'Smart Switch',         cat: 'Samsung' },
  { pkg: 'com.microsoft.teams',               nombre: 'Microsoft Teams',      cat: 'Corporativo' },
  { pkg: 'com.whatsapp',                      nombre: 'WhatsApp',             cat: 'Corporativo' },
  { pkg: 'com.microsoft.outlook',             nombre: 'Outlook',              cat: 'Corporativo' },
  { pkg: 'com.android.vending',               nombre: 'Google Play Store',    cat: 'Google' },
]

// ─── Restricciones completas Android Enterprise ───────────────────────────────
const RESTRICCIONES_CATEGORIAS: {
  cat: string
  desc?: string
  items: { key: string; label: string; desc?: string; defecto: boolean }[]
}[] = [
  {
    cat: 'Control de aplicaciones',
    items: [
      { key: 'appControl',              label: 'Control de aplicaciones',                       desc: 'Impide desinstalar, deshabilitar, limpiar caché/datos, forzar cierre y borrar valores por defecto de apps', defecto: true },
      { key: 'appUninstall',            label: 'Permitir desinstalación de apps',           desc: 'Si se desactiva, el usuario NO puede desinstalar aplicaciones', defecto: false },
      { key: 'disableAppVerification',  label: 'Deshabilitar verificación de apps',         desc: 'Impide que el usuario desactive la verificación de aplicaciones', defecto: true },
      { key: 'unknownSources',          label: 'Bloquear fuentes desconocidas',                desc: 'Impide instalar apps fuera de Google Play. Solo funciona en modo Device Owner', defecto: true },
    ]
  },
  {
    cat: 'Restricciones comunes',
    desc: 'Aplican tanto a dispositivos fully managed como a perfil de trabajo',
    items: [
      { key: 'autofill',               label: 'Bloquear autocompletar (Autofill)',             desc: 'Android 8.0+', defecto: false },
      { key: 'bluetoothSharing',       label: 'Bloquear compartir por Bluetooth',              desc: 'Android 8.0+', defecto: false },
      { key: 'camera',                 label: 'Deshabilitar cámara',                      defecto: false },
      { key: 'credentialsConfig',      label: 'Bloquear configuración de credenciales',    defecto: false },
      { key: 'debugging',              label: 'Bloquear depuración (USB/ADB)',             defecto: false },
      { key: 'languageConfig',         label: 'Bloquear cambio de idioma',                    desc: 'Android 9.0+', defecto: false },
      { key: 'locationProviderConfig', label: 'Bloquear configuración de ubicación',  desc: 'Android 9.0+', defecto: false },
      { key: 'locationShare',          label: 'Bloquear compartir ubicación',              defecto: false },
      { key: 'nfcBeam',               label: 'Bloquear NFC beam (enviar datos por NFC)',      defecto: false },
      { key: 'printing',              label: 'Bloquear impresión',                        desc: 'Android 9.0+', defecto: false },
      { key: 'screenCapture',         label: 'Bloquear capturas de pantalla',                 defecto: false },
      { key: 'systemErrorDialogs',    label: 'Bloquear diálogos de error del sistema',    desc: 'Android 9.0+. Cuando se deniega, el sistema fuerza el cierre de la app', defecto: false },
      { key: 'userIconModification',  label: 'Bloquear cambio de ícono de usuario',       desc: 'Android 7.0+', defecto: false },
      { key: 'vpnConfig',             label: 'Bloquear configuración de VPN',              defecto: false },
      { key: 'wallpaperModification', label: 'Bloquear cambio de fondo de pantalla',          desc: 'Android 7.0+', defecto: false },
    ]
  },
  {
    cat: 'Fully Managed (dispositivo corporativo)',
    desc: 'Solo aplican cuando el dispositivo está en modo Device Owner (enrolamiento completo)',
    items: [
      { key: 'addManagedProfiles',       label: 'Bloquear agregar perfiles administrados',    desc: 'Android 8.0+', defecto: true },
      { key: 'addUsers',                 label: 'Bloquear agregar usuarios',                  defecto: true },
      { key: 'adjustVolume',             label: 'Bloquear ajuste de volumen',                 defecto: false },
      { key: 'airplaneMode',             label: 'Bloquear modo avión',                    desc: 'Android 9.0+', defecto: false },
      { key: 'ambientDisplay',           label: 'Bloquear pantalla ambiental (Always On)',    desc: 'Android 9.0+', defecto: false },
      { key: 'audio',                    label: 'Deshabilitar audio del dispositivo (silencio total)', defecto: false },
      { key: 'backupService',            label: 'Bloquear servicio de copia de seguridad',    desc: 'Android 8.0+. Deshabilitado por defecto al enrolar', defecto: true },
      { key: 'bluetooth',                label: 'Deshabilitar Bluetooth',                     desc: 'Android 8.0+', defecto: false },
      { key: 'bluetoothConfig',          label: 'Bloquear configuración de Bluetooth',    defecto: false },
      { key: 'brightnessConfig',         label: 'Bloquear cambio de brillo',                  desc: 'Android 9.0+', defecto: false },
      { key: 'cellularBroadcastConfig',  label: 'Bloquear configuración de alertas de emergencia celular', defecto: false },
      { key: 'createWindows',            label: 'Bloquear creación de ventanas sobre otras apps', defecto: false },
      { key: 'dataRoaming',              label: 'Bloquear roaming de datos',                  desc: 'Android 7.0+', defecto: false },
      { key: 'dateTimeConfig',           label: 'Bloquear cambio de fecha/hora/zona horaria', desc: 'Android 9.0+', defecto: false },
      { key: 'factoryReset',             label: 'Bloquear Factory Reset',                     desc: 'También previene el hard reset. ⚠️ Recordar la contraseña', defecto: true },
      { key: 'fun',                      label: 'Bloquear Easter eggs en Ajustes (fun)',       defecto: false },
      { key: 'mobileNetworkConfig',      label: 'Bloquear configuración de red móvil', defecto: false },
      { key: 'mountPhysicalMedia',       label: 'Bloquear montaje de medios físicos (SD/USB)', defecto: false },
      { key: 'networkReset',             label: 'Bloquear restablecer configuración de red', defecto: true },
      { key: 'outgoingCalls',            label: 'Bloquear llamadas salientes',                defecto: false },
      { key: 'removeManagedProfiles',    label: 'Bloquear eliminar perfiles administrados',   desc: 'Android 8.0+', defecto: true },
      { key: 'removeUsers',              label: 'Bloquear eliminar usuarios',                 defecto: true },
      { key: 'safeBoot',                 label: 'Bloquear reinicio en modo seguro',           defecto: true },
      { key: 'screenOffTimeoutConfig',   label: 'Bloquear cambio de tiempo de apagado de pantalla', desc: 'Android 9.0+', defecto: false },
      { key: 'sms',                      label: 'Bloquear envío/recepción de SMS',   defecto: false },
      { key: 'tetheringConfig',          label: 'Bloquear configuración de tethering/hotspot', defecto: false },
      { key: 'ultraWideBand',            label: 'Bloquear comunicación Ultra-Wideband (UWB)', defecto: false },
      { key: 'unmuteMicrophone',         label: 'Bloquear activar micrófono',             defecto: false },
      { key: 'usbFileTransfer',          label: 'Bloquear transferencia de archivos por USB', defecto: false },
      { key: 'userSwitch',               label: 'Bloquear cambio de usuario',                 desc: 'Android 9.0+', defecto: true },
      { key: 'wifiConfig',               label: 'Bloquear configuración de Wi-Fi',        defecto: false },
      { key: 'playStorePersonal',        label: 'Bloquear Google Play personal (cuentas no administradas)', desc: 'Solo permite el Play administrado de empresa', defecto: false },
    ]
  },
  {
    cat: 'Perfil de trabajo (Work Profile)',
    desc: 'Solo aplican al perfil de trabajo cuando el dispositivo usa modo Work Profile',
    items: [
      { key: 'crossProfileCallerId',     label: 'Mostrar ID de llamada del perfil de trabajo en perfil personal', defecto: true },
      { key: 'crossProfileContactSearch',label: 'Mostrar contactos del trabajo en búsquedas del perfil personal', desc: 'Android 7.0+', defecto: true },
      { key: 'crossProfileCopyPaste',    label: 'Permitir copiar/pegar entre perfiles',       defecto: false },
      { key: 'bluetoothContactSharing',  label: 'Compartir contactos del trabajo por Bluetooth', defecto: false },
      { key: 'shareIntoWorkProfile',     label: 'Permitir compartir archivos del perfil personal al de trabajo', desc: 'Android 9.0+', defecto: true },
      { key: 'unifiedPasscode',          label: 'Permitir contraseña unificada entre perfiles', desc: 'Android 9.0+', defecto: false },
      { key: 'workProfileWidgets',       label: 'Permitir widgets de apps del trabajo en pantalla principal', defecto: false },
    ]
  },
  {
    cat: 'Gestión de cuentas',
    items: [
      { key: 'accountModification',      label: 'Bloquear agregar/eliminar cuentas',          desc: 'Excluye las cuentas agregadas programáticamente por el MDM', defecto: true },
    ]
  },
]

// Keys con sus valores por defecto (para inicializar el form)
const DEFAULT_RESTRICCIONES: Record<string, boolean> = {}
RESTRICCIONES_CATEGORIAS.forEach(c => c.items.forEach(r => { DEFAULT_RESTRICCIONES[r.key] = r.defecto }))

// ─── Apps por defecto ─────────────────────────────────────────────────────────
const defaultForm = () => ({
  nombre: '',
  descripcion: '',
  apps_ocultar: [
    'com.google.android.youtube','com.facebook.katana','com.instagram.android',
    'com.zhiliaoapp.musically','com.whatsapp.w4b','com.telegram.messenger',
    'com.snapchat.android','com.dti.amx','com.claro.pe.miclaro',
    'com.sec.android.app.sbrowser','com.samsung.android.game.gamehome',
    'com.samsung.android.themestore','com.samsung.android.app.galaxystore',
    'com.samsung.android.scloud',
  ],
  apps_proteger: ['com.microsoft.teams','com.whatsapp','com.microsoft.outlook'],
  restricciones: { ...DEFAULT_RESTRICCIONES },
  bloqueo_auto_minutos: 3,
})

interface Perfil {
  id: number
  nombre: string
  descripcion: string
  apps_ocultar: string[]
  apps_proteger: string[]
  restricciones: Record<string, boolean>
  bloqueo_auto_minutos: number
  dispositivos_asignados: number
  creado_en: string
}

const Perfiles: React.FC = () => {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [form, setForm] = useState<any | null>(null)
  const [esNuevo, setEsNuevo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [seccionesApps, setSeccionesApps] = useState<Record<string, boolean>>({})
  const [seccionesRest, setSeccionesRest] = useState<Record<string, boolean>>(
    Object.fromEntries(RESTRICCIONES_CATEGORIAS.map(c => [c.cat, true]))
  )
  const [pkgCustom, setPkgCustom] = useState('')

  const headers = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/perfiles`, headers())
      setPerfiles(res.data)
    } catch {}
  }

  useEffect(() => { cargar() }, [])

  const toggleApp = (tipo: 'ocultar' | 'proteger', pkg: string) => {
    const key = tipo === 'ocultar' ? 'apps_ocultar' : 'apps_proteger'
    const lista: string[] = form[key]
    setForm({ ...form, [key]: lista.includes(pkg) ? lista.filter((p: string) => p !== pkg) : [...lista, pkg] })
  }

  const agregarCustom = (tipo: 'ocultar' | 'proteger') => {
    const pkg = pkgCustom.trim()
    if (!pkg) return
    const key = tipo === 'ocultar' ? 'apps_ocultar' : 'apps_proteger'
    if (!form[key].includes(pkg)) setForm({ ...form, [key]: [...form[key], pkg] })
    setPkgCustom('')
  }

  const toggleRest = (key: string) => {
    setForm({ ...form, restricciones: { ...form.restricciones, [key]: !form.restricciones[key] } })
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { alert('El perfil necesita un nombre'); return }
    setGuardando(true)
    try {
      if (esNuevo) await axios.post(`${API}/perfiles`, form, headers())
      else await axios.put(`${API}/perfiles/${form.id}`, form, headers())
      await cargar()
      setForm(null)
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setGuardando(false) }
  }

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar este perfil?')) return
    try { await axios.delete(`${API}/perfiles/${id}`, headers()); cargar() } catch {}
  }

  const catsApps = [...new Set(APPS_CONOCIDAS.map(a => a.cat))]

  // ── Lista de perfiles ──────────────────────────────────────────────────────
  if (!form) return (
    <Layout titulo="Perfiles de Políticas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-palmas-light text-sm">Define las políticas que se aplican a los dispositivos al enrolar</p>
          <button onClick={() => { setForm(defaultForm()); setEsNuevo(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-palmas-green text-white rounded-lg text-sm font-medium hover:bg-palmas-accent transition-all">
            <Plus className="w-4 h-4" /> Nuevo perfil
          </button>
        </div>

        {perfiles.length === 0 && (
          <div className="bg-palmas-card rounded-xl p-12 border border-green-900 text-center">
            <Package className="w-12 h-12 text-palmas-light mx-auto mb-4" />
            <p className="text-white font-bold mb-2">Sin perfiles configurados</p>
            <p className="text-palmas-light text-sm mb-4">Crea un perfil para definir las políticas de los dispositivos</p>
            <button onClick={() => { setForm(defaultForm()); setEsNuevo(true) }}
              className="px-4 py-2 bg-palmas-green text-white rounded-lg text-sm">Crear primer perfil</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perfiles.map(p => {
            const restActivas = Object.values(p.restricciones ?? {}).filter(Boolean).length
            const restTotal = Object.keys(DEFAULT_RESTRICCIONES).length
            return (
              <div key={p.id} className="bg-palmas-card rounded-xl p-6 border border-green-900">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold">{p.nombre}</h3>
                    {p.descripcion && <p className="text-palmas-light text-sm mt-1">{p.descripcion}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setForm({ ...p, restricciones: { ...DEFAULT_RESTRICCIONES, ...(p.restricciones ?? {}) } }); setEsNuevo(false) }}
                      className="text-palmas-light hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => eliminar(p.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-palmas-dark rounded-lg p-3">
                    <p className="text-palmas-green text-xl font-bold">{p.apps_ocultar?.length ?? 0}</p>
                    <p className="text-palmas-light text-xs">Apps bloqueadas</p>
                  </div>
                  <div className="bg-palmas-dark rounded-lg p-3">
                    <p className="text-palmas-green text-xl font-bold">{p.apps_proteger?.length ?? 0}</p>
                    <p className="text-palmas-light text-xs">Apps protegidas</p>
                  </div>
                  <div className="bg-palmas-dark rounded-lg p-3">
                    <p className="text-palmas-green text-xl font-bold">{restActivas}/{restTotal}</p>
                    <p className="text-palmas-light text-xs">Restricciones</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )

  // ── Editor de perfil ───────────────────────────────────────────────────────
  return (
    <Layout titulo={esNuevo ? 'Nuevo perfil' : `Editar: ${form.nombre}`}>
      <div className="max-w-4xl space-y-6">

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <button onClick={() => setForm(null)} className="flex items-center gap-2 text-palmas-light hover:text-white text-sm">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex items-center gap-2 px-6 py-2 bg-palmas-green text-white rounded-lg font-bold hover:bg-palmas-accent disabled:opacity-50">
            <Save className="w-4 h-4" />{guardando ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>

        {/* Info básica */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <h3 className="text-white font-bold mb-4">Información del perfil</h3>
          <div className="space-y-4">
            <div>
              <label className="text-palmas-light text-sm mb-2 block">Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Perfil Operativo Tulumayo"
                className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green" />
            </div>
            <div>
              <label className="text-palmas-light text-sm mb-2 block">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Para qué área o rol es este perfil" rows={2}
                className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-palmas-light text-sm">Bloqueo automático de pantalla</span>
                <p className="text-palmas-light text-xs opacity-60">Minutos de inactividad</p>
              </div>
              <select value={form.bloqueo_auto_minutos}
                onChange={e => setForm({ ...form, bloqueo_auto_minutos: Number(e.target.value) })}
                className="bg-palmas-dark border border-green-900 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                {[1, 2, 3, 5, 10, 15, 30].map(m => (
                  <option key={m} value={m}>{m} {m === 1 ? 'minuto' : 'minutos'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Restricciones por categoría */}
        {RESTRICCIONES_CATEGORIAS.map(categoria => {
          const abierto = seccionesRest[categoria.cat] !== false
          const activasEnCat = categoria.items.filter(r => form.restricciones[r.key]).length
          return (
            <div key={categoria.cat} className="bg-palmas-card rounded-xl border border-green-900 overflow-hidden">
              <button
                onClick={() => setSeccionesRest(prev => ({ ...prev, [categoria.cat]: !abierto }))}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-palmas-dark/50 transition-all">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-palmas-light" />
                  <div className="text-left">
                    <span className="text-white font-bold text-sm">{categoria.cat}</span>
                    {categoria.desc && <p className="text-palmas-light text-xs mt-0.5">{categoria.desc}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">
                    {activasEnCat}/{categoria.items.length} activas
                  </span>
                  {abierto ? <ChevronUp className="w-4 h-4 text-palmas-light" /> : <ChevronDown className="w-4 h-4 text-palmas-light" />}
                </div>
              </button>

              {abierto && (
                <div className="border-t border-green-900 divide-y divide-green-900/30">
                  {categoria.items.map(r => (
                    <div key={r.key} className="flex items-center justify-between px-6 py-3 hover:bg-palmas-dark/30">
                      <div className="flex-1 pr-4">
                        <p className="text-palmas-light text-sm">{r.label}</p>
                        {r.desc && <p className="text-palmas-light text-xs opacity-50 mt-0.5">{r.desc}</p>}
                      </div>
                      <button
                        onClick={() => toggleRest(r.key)}
                        className={`w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                          form.restricciones[r.key] ? 'bg-palmas-green' : 'bg-palmas-dark border border-green-900'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                          form.restricciones[r.key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Apps a ocultar */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Apps a ocultar / bloquear</h3>
            <span className="ml-auto text-sm bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">{form.apps_ocultar.length} seleccionadas</span>
          </div>
          <p className="text-palmas-light text-xs mb-4">Se aplica setApplicationHidden — el usuario no ve ni puede usar estas apps</p>

          {catsApps.map(cat => {
            const apps = APPS_CONOCIDAS.filter(a => a.cat === cat)
            const abierto = seccionesApps[cat] !== false
            return (
              <div key={cat} className="mb-2 border border-green-900/50 rounded-lg overflow-hidden">
                <button onClick={() => setSeccionesApps(prev => ({ ...prev, [cat]: !abierto }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-palmas-dark hover:bg-palmas-dark/80">
                  <span className="text-white text-sm font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-palmas-light text-xs">{apps.filter(a => form.apps_ocultar.includes(a.pkg)).length}/{apps.length}</span>
                    {abierto ? <ChevronUp className="w-4 h-4 text-palmas-light" /> : <ChevronDown className="w-4 h-4 text-palmas-light" />}
                  </div>
                </button>
                {abierto && (
                  <div className="divide-y divide-green-900/30">
                    {apps.map(app => (
                      <label key={app.pkg} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-palmas-dark/50">
                        <input type="checkbox" checked={form.apps_ocultar.includes(app.pkg)}
                          onChange={() => toggleApp('ocultar', app.pkg)} className="accent-palmas-green w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{app.nombre}</p>
                          <p className="text-palmas-light text-xs font-mono truncate">{app.pkg}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="mt-3 flex gap-2">
            <input type="text" value={pkgCustom} onChange={e => setPkgCustom(e.target.value)}
              placeholder="com.paquete.personalizado"
              className="flex-1 bg-palmas-dark border border-green-900 rounded-lg px-4 py-2 text-white text-sm focus:outline-none font-mono"
              onKeyDown={e => e.key === 'Enter' && agregarCustom('ocultar')} />
            <button onClick={() => agregarCustom('ocultar')}
              className="px-3 py-2 bg-palmas-green text-white rounded-lg text-sm hover:bg-palmas-accent">+ Agregar</button>
          </div>
          {form.apps_ocultar.filter((p: string) => !APPS_CONOCIDAS.find(a => a.pkg === p)).map((pkg: string) => (
            <div key={pkg} className="flex items-center justify-between mt-2 px-4 py-2 bg-palmas-dark rounded-lg border border-green-900/50">
              <span className="text-palmas-light text-xs font-mono">{pkg}</span>
              <button onClick={() => toggleApp('ocultar', pkg)} className="text-red-400 hover:text-red-300 text-xs">Quitar</button>
            </div>
          ))}
        </div>

        {/* Apps protegidas */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Apps protegidas (no desinstalar)</h3>
            <span className="ml-auto text-sm bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">{form.apps_proteger.length} seleccionadas</span>
          </div>
          <p className="text-palmas-light text-xs mb-4">Se aplica setUninstallBlocked — el usuario no puede desinstalar estas apps</p>
          <div className="divide-y divide-green-900/30 border border-green-900/50 rounded-lg overflow-hidden mb-4">
            {APPS_CONOCIDAS.filter(a => ['Corporativo', 'Google'].includes(a.cat)).map(app => (
              <label key={app.pkg} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-palmas-dark">
                <input type="checkbox" checked={form.apps_proteger.includes(app.pkg)}
                  onChange={() => toggleApp('proteger', app.pkg)} className="accent-palmas-green w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{app.nombre}</p>
                  <p className="text-palmas-light text-xs font-mono truncate">{app.pkg}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={pkgCustom} onChange={e => setPkgCustom(e.target.value)}
              placeholder="com.app.a.proteger"
              className="flex-1 bg-palmas-dark border border-green-900 rounded-lg px-4 py-2 text-white text-sm focus:outline-none font-mono"
              onKeyDown={e => e.key === 'Enter' && agregarCustom('proteger')} />
            <button onClick={() => agregarCustom('proteger')}
              className="px-3 py-2 bg-palmas-green text-white rounded-lg text-sm hover:bg-palmas-accent">+ Agregar</button>
          </div>
          {form.apps_proteger.filter((p: string) => !APPS_CONOCIDAS.find(a => a.pkg === p)).map((pkg: string) => (
            <div key={pkg} className="flex items-center justify-between mt-2 px-4 py-2 bg-palmas-dark rounded-lg border border-green-900/50">
              <span className="text-palmas-light text-xs font-mono">{pkg}</span>
              <button onClick={() => toggleApp('proteger', pkg)} className="text-red-400 hover:text-red-300 text-xs">Quitar</button>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  )
}

export default Perfiles
