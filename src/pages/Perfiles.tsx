import React, { useState, useEffect } from 'react'
import Layout from '../components/layout/Layout'
import { Package, Plus, Edit2, Trash2, Save, X, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'

const APPS_CONOCIDAS = [
  { pkg: 'com.google.android.youtube', nombre: 'YouTube', cat: 'Redes sociales' },
  { pkg: 'com.facebook.katana', nombre: 'Facebook', cat: 'Redes sociales' },
  { pkg: 'com.instagram.android', nombre: 'Instagram', cat: 'Redes sociales' },
  { pkg: 'com.zhiliaoapp.musically', nombre: 'TikTok', cat: 'Redes sociales' },
  { pkg: 'com.whatsapp.w4b', nombre: 'WhatsApp Business', cat: 'Redes sociales' },
  { pkg: 'com.telegram.messenger', nombre: 'Telegram', cat: 'Redes sociales' },
  { pkg: 'com.snapchat.android', nombre: 'Snapchat', cat: 'Redes sociales' },
  { pkg: 'com.dti.amx', nombre: 'Claro AMX', cat: 'Bloatware Claro' },
  { pkg: 'com.claro.pe.miclaro', nombre: 'Mi Claro', cat: 'Bloatware Claro' },
  { pkg: 'com.claro.claromusica.latam', nombre: 'Claro Música', cat: 'Bloatware Claro' },
  { pkg: 'com.wssyncmldm', nombre: 'Claro DM Sync', cat: 'Bloatware Claro' },
  { pkg: 'com.hiya.star', nombre: 'Hiya (Claro)', cat: 'Bloatware Claro' },
  { pkg: 'com.sec.android.app.sbrowser', nombre: 'Samsung Internet', cat: 'Samsung' },
  { pkg: 'com.samsung.android.game.gamehome', nombre: 'Game Launcher', cat: 'Samsung' },
  { pkg: 'com.sec.android.app.shealth', nombre: 'Samsung Health', cat: 'Samsung' },
  { pkg: 'com.samsung.android.themestore', nombre: 'Galaxy Themes', cat: 'Samsung' },
  { pkg: 'com.samsung.android.app.galaxystore', nombre: 'Galaxy Store', cat: 'Samsung' },
  { pkg: 'com.samsung.android.scloud', nombre: 'Samsung Cloud', cat: 'Samsung' },
  { pkg: 'com.samsung.knox.securefolder', nombre: 'Secure Folder', cat: 'Samsung' },
  { pkg: 'com.sec.android.easyMover', nombre: 'Smart Switch', cat: 'Samsung' },
  { pkg: 'com.microsoft.teams', nombre: 'Microsoft Teams', cat: 'Corporativo' },
  { pkg: 'com.whatsapp', nombre: 'WhatsApp', cat: 'Corporativo' },
  { pkg: 'com.microsoft.outlook', nombre: 'Outlook', cat: 'Corporativo' },
  { pkg: 'com.android.vending', nombre: 'Google Play Store', cat: 'Google' },
]

const RESTRICCIONES = [
  { key: 'instalacionBloqueada', label: 'Bloquear instalación de fuentes desconocidas', defecto: true },
  { key: 'desinstalarBloqueado', label: 'Bloquear desinstalación de apps', defecto: true },
  { key: 'factoryResetBloqueado', label: 'Bloquear Factory Reset', defecto: true },
  { key: 'usbDebuggingBloqueado', label: 'Bloquear depuración USB', defecto: false },
  { key: 'wifiBloqueado', label: 'Bloquear configuración WiFi', defecto: false },
  { key: 'bluetoothBloqueado', label: 'Bloquear configuración Bluetooth', defecto: false },
  { key: 'camaraDeshabilitada', label: 'Deshabilitar cámara', defecto: false },
  { key: 'capturasPantallaBloqueadas', label: 'Bloquear capturas de pantalla', defecto: false },
  { key: 'roamingDatosBloqueado', label: 'Bloquear roaming de datos', defecto: false },
  { key: 'agregarUsuarioBloqueado', label: 'Bloquear agregar usuarios', defecto: true },
  { key: 'pinRequerido', label: 'Requerir PIN / contraseña de pantalla', defecto: true },
]

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
  restricciones: Object.fromEntries(RESTRICCIONES.map(r => [r.key, r.defecto])),
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
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({})
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

  const categorias = [...new Set(APPS_CONOCIDAS.map(a => a.cat))]

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
          {perfiles.map(p => (
            <div key={p.id} className="bg-palmas-card rounded-xl p-6 border border-green-900">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold">{p.nombre}</h3>
                  {p.descripcion && <p className="text-palmas-light text-sm mt-1">{p.descripcion}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ ...p }); setEsNuevo(false) }}
                    className="text-palmas-light hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(p.id)}
                    className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
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
                  <p className="text-palmas-green text-xl font-bold">{p.dispositivos_asignados ?? 0}</p>
                  <p className="text-palmas-light text-xs">Enrolamientos</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(p.restricciones ?? {}).filter(([, v]) => v).slice(0, 3).map(([k]) => (
                  <span key={k} className="text-xs bg-green-900/30 text-palmas-light px-2 py-0.5 rounded">
                    {RESTRICCIONES.find(r => r.key === k)?.label.split(' ').slice(0, 3).join(' ') ?? k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout titulo={esNuevo ? 'Nuevo perfil' : `Editar: ${form.nombre}`}>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setForm(null)} className="flex items-center gap-2 text-palmas-light hover:text-white text-sm">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex items-center gap-2 px-6 py-2 bg-palmas-green text-white rounded-lg font-bold hover:bg-palmas-accent transition-all disabled:opacity-50">
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
          </div>
        </div>

        {/* Restricciones */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Restricciones del dispositivo</h3>
          </div>
          <div className="space-y-1">
            {RESTRICCIONES.map(r => (
              <div key={r.key} className="flex items-center justify-between py-3 border-b border-green-900/40 last:border-0">
                <span className="text-palmas-light text-sm">{r.label}</span>
                <button onClick={() => setForm({ ...form, restricciones: { ...form.restricciones, [r.key]: !form.restricciones[r.key] } })}
                  className={`w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                    form.restricciones[r.key] ? 'bg-palmas-green' : 'bg-palmas-dark border border-green-900'
                  }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    form.restricciones[r.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 mt-1">
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

        {/* Apps a ocultar */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Apps a ocultar / bloquear</h3>
            <span className="ml-auto text-sm bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">{form.apps_ocultar.length} seleccionadas</span>
          </div>
          <p className="text-palmas-light text-xs mb-4">Se aplica setApplicationHidden en el dispositivo</p>
          {categorias.map(cat => {
            const apps = APPS_CONOCIDAS.filter(a => a.cat === cat)
            const abierto = seccionesAbiertas[cat] !== false
            return (
              <div key={cat} className="mb-2 border border-green-900/50 rounded-lg overflow-hidden">
                <button onClick={() => setSeccionesAbiertas(prev => ({ ...prev, [cat]: !abierto }))}
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
                          onChange={() => toggleApp('ocultar', app.pkg)}
                          className="accent-palmas-green w-4 h-4" />
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
            <h3 className="text-white font-bold">Apps protegidas</h3>
            <span className="ml-auto text-sm bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">{form.apps_proteger.length} seleccionadas</span>
          </div>
          <p className="text-palmas-light text-xs mb-4">No se pueden desinstalar (setUninstallBlocked)</p>
          <div className="divide-y divide-green-900/30 border border-green-900/50 rounded-lg overflow-hidden mb-4">
            {APPS_CONOCIDAS.filter(a => ['Corporativo', 'Google'].includes(a.cat)).map(app => (
              <label key={app.pkg} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-palmas-dark">
                <input type="checkbox" checked={form.apps_proteger.includes(app.pkg)}
                  onChange={() => toggleApp('proteger', app.pkg)}
                  className="accent-palmas-green w-4 h-4" />
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
