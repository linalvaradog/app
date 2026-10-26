import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import {
  QrCode, RefreshCw, Trash2, Clock, CheckCircle, Download,
  Smartphone, Wifi, Shield, Settings, Wrench, ChevronDown, ChevronUp,
  Nfc, Package, AlertTriangle, BookOpen, Zap, Monitor, Key
} from 'lucide-react'
import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'
const SEDES = ['Tulumayo', 'Shanusi', 'Palmawasi', 'Nuevo Horizonte', 'Lima']

interface Token {
  id: number; token: string; sede: string; perfil_id: number | null
  perfil_nombre: string | null; creado_en: string; expira_en: string
  usado: boolean; dispositivo_imei: string | null
}

type Tab = 'enrolamiento' | 'configuracion' | 'apps' | 'acciones' | 'soporte'

interface GuideItem { title: string; desc: string; icon?: React.ReactNode; badge?: string }
interface GuideSection { title: string; icon: React.ReactNode; items: GuideItem[] }

const GUIDES: Record<Tab, GuideSection[]> = {
  enrolamiento: [
    {
      title: 'Métodos de Enrolamiento',
      icon: <QrCode className="w-4 h-4" />,
      items: [
        { title: 'Gestión de dispositivos Android', desc: 'Configurar dispositivos Android bajo gestión MDM corporativa mediante Android Enterprise.', icon: <Smartphone className="w-4 h-4" /> },
        { title: 'Enrolamiento por QR (Fully Managed)', desc: 'Enrola dispositivos en modo completamente gestionado escaneando un QR durante el setup inicial. Compatible con todos los modelos Android 7+.', icon: <QrCode className="w-4 h-4" />, badge: 'Recomendado' },
        { title: 'Enrolamiento por Token', desc: 'Usa el token alfanumérico generado en este panel durante la configuración inicial del dispositivo (afw#token).', icon: <Key className="w-4 h-4" /> },
        { title: 'Enrolamiento por NFC', desc: 'Transfiere la configuración por NFC entre dos dispositivos durante el setup inicial. Requiere dispositivos con NFC habilitado.', icon: <Nfc className="w-4 h-4" /> },
        { title: 'Work Profile (Perfil de trabajo)', desc: 'Configura un perfil de trabajo en dispositivos personales (BYOD). Separa datos corporativos de personales.', icon: <Shield className="w-4 h-4" /> },
        { title: 'COPE — Fully Managed con Work Profile', desc: 'Dispositivos corporativos con perfil de trabajo separado. Combina control total del dispositivo con separación de datos.', icon: <Shield className="w-4 h-4" /> },
        { title: 'Samsung Knox Mobile Enrollment', desc: 'Enrolamiento automático masivo para dispositivos Samsung mediante Knox. Sin intervención del usuario final.', icon: <Zap className="w-4 h-4" />, badge: 'Samsung' },
        { title: 'Android Zero-Touch Enrollment', desc: 'Enrolamiento automático al encender por primera vez. Requiere acuerdo con el proveedor del dispositivo.', icon: <Zap className="w-4 h-4" /> },
        { title: 'Dispositivos sin cámara o sin Google Services', desc: 'Enrolamiento mediante archivo APK o token para dispositivos sin cámara o sin Google Play Services.', icon: <Wrench className="w-4 h-4" /> },
        { title: 'Dispositivo compartido o sin asignar', desc: 'Enrola dispositivos que serán usados por múltiples colaboradores (shared device mode).', icon: <Smartphone className="w-4 h-4" /> },
        { title: 'Enrolamiento masivo por archivo de configuración', desc: 'Configura múltiples dispositivos usando un archivo de configuración personalizado para despliegues masivos.', icon: <Package className="w-4 h-4" /> },
        { title: 'Auto-enrolamiento (Self-Service)', desc: 'El usuario final enrola su propio dispositivo siguiendo instrucciones enviadas por el administrador.', icon: <Smartphone className="w-4 h-4" /> },
        { title: 'Instalación del cliente MDM por APK', desc: 'Instala manualmente el agente MDM en dispositivos que no tienen acceso a Google Play Store.', icon: <Download className="w-4 h-4" /> },
        { title: 'Cliente MDM — Versiones mínimas', desc: 'Consulta los requisitos mínimos de versión del agente MDM según modelo y versión de Android.', icon: <AlertTriangle className="w-4 h-4" /> },
        { title: 'Instrucciones para el usuario final', desc: 'Guía paso a paso para entregar al colaborador que debe enrolar su dispositivo Android.', icon: <BookOpen className="w-4 h-4" /> },
      ]
    }
  ],
  configuracion: [
    {
      title: 'Pantalla y Modo Quiosco',
      icon: <Monitor className="w-4 h-4" />,
      items: [
        { title: 'Launcher personalizado — Pantalla de inicio y modo quiosco', desc: 'Configura qué apps aparecen en la pantalla de inicio y cómo se comporta el dispositivo en modo quiosco.', badge: 'Importante' },
        { title: 'Modo quiosco con 1 app', desc: 'Bloquea el dispositivo para que solo ejecute una aplicación específica. Ideal para terminales de punto de venta o consulta.' },
        { title: 'Modo quiosco con múltiples apps', desc: 'Permite un conjunto controlado de aplicaciones en modo quiosco. El usuario no puede salir de estas apps.' },
        { title: 'Web apps en pantalla de inicio', desc: 'Agrega accesos directos a páginas web como si fueran aplicaciones nativas en la pantalla de inicio.' },
        { title: 'Salida temporal del modo quiosco', desc: 'Cómo salir temporalmente del modo quiosco para mantenimiento, sin desactivarlo permanentemente.' },
        { title: 'Quiosco Samsung Knox', desc: 'Configuración específica de modo quiosco para dispositivos Samsung con Knox habilitado.', badge: 'Samsung' },
        { title: 'Desactivar modo quiosco', desc: 'Pasos para desactivar permanentemente el modo quiosco en un dispositivo.' },
        { title: 'Fondo de pantalla en dispositivos Android', desc: 'Despliega un fondo de pantalla corporativo en todos los dispositivos gestionados.' },
        { title: 'Direct Boot Mode', desc: 'Configura aplicaciones que arrancan antes de que el usuario desbloquee el dispositivo.' },
      ]
    },
    {
      title: 'Seguridad y Restricciones',
      icon: <Shield className="w-4 h-4" />,
      items: [
        { title: 'Restricciones en dispositivos Android', desc: 'Configura qué funciones del dispositivo están disponibles para el usuario: cámara, bluetooth, USB, etc.' },
        { title: 'Política de contraseña', desc: 'Define requisitos de complejidad, longitud y expiración de la contraseña del dispositivo.' },
        { title: 'Restablecer contraseña de forma remota', desc: 'Restablece o desbloquea el PIN/patrón del dispositivo de forma remota desde el panel.' },
        { title: 'Prevenir restablecimiento de fábrica', desc: 'Impide que el usuario realice un factory reset no autorizado en dispositivos gestionados.' },
        { title: 'Protección contra restablecimiento de fábrica (FRP)', desc: 'Configura cuentas autorizadas para pasar la verificación FRP tras un reset.' },
        { title: 'Cifrado del dispositivo', desc: 'Verifica y fuerza el cifrado del almacenamiento en dispositivos gestionados.' },
        { title: 'Restricciones solo Work Profile', desc: 'Restricciones específicas para el perfil de trabajo en dispositivos BYOD/COPE.' },
        { title: 'Restricciones Samsung Safe/Knox', desc: 'Restricciones avanzadas disponibles solo en dispositivos Samsung con Knox.', badge: 'Samsung' },
        { title: 'Característica de seguridad para deshabilitar restricciones', desc: 'Mecanismo de seguridad para desactivar restricciones en caso de emergencia.' },
        { title: 'Restringir cuentas Google personales', desc: 'Impide que los usuarios añadan cuentas Google personales en dispositivos corporativos.' },
        { title: 'Prevenir eliminación de cuenta Google administrada', desc: 'Evita que el usuario elimine la cuenta de Google Play gestionada del dispositivo.' },
      ]
    },
    {
      title: 'Red y Conectividad',
      icon: <Wifi className="w-4 h-4" />,
      items: [
        { title: 'Configurar Wi-Fi para dispositivos Android', desc: 'Despliega perfiles Wi-Fi corporativos (SSID, contraseña, seguridad) de forma automática.' },
        { title: 'VPN siempre activa (Always-on VPN)', desc: 'Configura una VPN que se conecta automáticamente y no puede desactivarse.' },
        { title: 'Inventario de uso de red', desc: 'Monitorea el consumo de datos móviles y Wi-Fi de cada dispositivo.' },
        { title: 'Despliegue de certificados', desc: 'Instala certificados CA y de cliente para autenticación en redes corporativas.' },
        { title: 'Email para Android (Knox)', desc: 'Configura cuentas de correo Exchange/IMAP en dispositivos Samsung con Knox.', badge: 'Samsung' },
        { title: 'Rastreo de ubicación Android', desc: 'Activa y gestiona el rastreo GPS de los dispositivos gestionados.' },
        { title: 'Gestión remota de configuración de ubicación', desc: 'Fuerza o deshabilita remotamente el GPS en dispositivos.' },
      ]
    },
    {
      title: 'Inventario y Actualizaciones',
      icon: <Settings className="w-4 h-4" />,
      items: [
        { title: 'Inventario Android recopilado', desc: 'Información de hardware, software, apps instaladas y estado del dispositivo recopilada automáticamente.' },
        { title: 'Política de actualización del sistema Android', desc: 'Controla cuándo y cómo se instalan las actualizaciones del SO: automático, ventana de tiempo, pospuesto.' },
        { title: 'Verificar versión Android y nivel de parche', desc: 'Consulta la versión de Android y el nivel de parche de seguridad de todos los dispositivos.' },
        { title: 'Cambiar usuario asignado a un dispositivo', desc: 'Reasigna un dispositivo a otro colaborador desde el panel.' },
        { title: 'Gestión de archivos', desc: 'Despliega y elimina archivos en dispositivos Android de forma remota.' },
        { title: 'Contactos para Android', desc: 'Despliega libretas de contactos corporativas en dispositivos gestionados.' },
        { title: 'Atajos web para Android', desc: 'Crea accesos directos a URLs en la pantalla de inicio de los dispositivos.' },
      ]
    }
  ],
  apps: [
    {
      title: 'Google Play Administrado',
      icon: <Package className="w-4 h-4" />,
      items: [
        { title: 'Configurar Google Play Enterprise administrado', desc: 'Conecta tu organización a Google Play administrado para desplegar apps sin cuenta Google personal.', badge: 'Requerido' },
        { title: 'Apps de Google Play administrado en MDM', desc: 'Agrega y gestiona aplicaciones desde Google Play Enterprise en el panel MDM.' },
        { title: 'Instalar apps de Google Play administrado', desc: 'Despliega apps de Google Play directamente en los dispositivos sin intervención del usuario.' },
        { title: 'Layout de la tienda Google Play administrado', desc: 'Personaliza qué apps ve el usuario en la tienda administrada y cómo están organizadas.' },
        { title: 'Cuentas de usuario Google Play administrado', desc: 'Gestiona las cuentas corporativas asociadas a Google Play Enterprise.' },
        { title: 'Política de actualización de apps Google Play', desc: 'Define si las apps se actualizan automáticamente, en horario nocturno o manualmente.' },
        { title: 'Agregar apps privadas a Google Play administrado', desc: 'Sube APKs privados al canal privado de Google Play Enterprise para distribución interna.' },
        { title: 'Configuraciones gestionadas para apps Android', desc: 'Preconfigurar apps corporativas (Gmail, Chrome, etc.) con settings específicos de la empresa.' },
        { title: 'Desconectar Google Play Enterprise', desc: 'Pasos para desvincular la organización de Google Play administrado.' },
      ]
    },
    {
      title: 'Gestión de Aplicaciones',
      icon: <Smartphone className="w-4 h-4" />,
      items: [
        { title: 'Agregar APKs (paquetes Android) al MDM', desc: 'Sube archivos APK al panel para distribuirlos en dispositivos sin Google Play.' },
        { title: 'Gestión de apps del sistema con listas de bloqueo/permiso', desc: 'Controla qué apps del sistema Android están visibles y disponibles para el usuario.' },
        { title: 'Bloquear/permitir apps específicas', desc: 'Listas blancas y negras de aplicaciones para dispositivos Samsung Knox.', badge: 'Samsung' },
        { title: 'Actualizar versiones de APKs Android', desc: 'Gestiona las actualizaciones de apps distribuidas como APK directamente.' },
        { title: 'Permisos de runtime para aplicaciones', desc: 'Configura permisos (cámara, ubicación, contactos) para apps gestionadas de forma centralizada.' },
        { title: 'Bloquear sitios web en Android', desc: 'Restringe el acceso a sitios web específicos en navegadores de dispositivos gestionados.' },
        { title: 'Samsung Galaxy Store', desc: 'Gestiona el acceso a la tienda Samsung Galaxy Store en dispositivos corporativos.', badge: 'Samsung' },
        { title: 'OEMConfig para Android Enterprise', desc: 'Configura funciones específicas del fabricante usando apps OEMConfig.' },
        { title: 'Web apps para Android Enterprise', desc: 'Despliega web apps como apps nativas en dispositivos Android Enterprise.' },
        { title: 'Pasar IDs de dispositivo a apps Android', desc: 'Transmite IMEI, número de serie u otros identificadores a apps corporativas via configuración gestionada.' },
      ]
    },
    {
      title: 'Configuraciones de Apps Específicas',
      icon: <Settings className="w-4 h-4" />,
      items: [
        { title: 'Google Chrome para Android — Configuración gestionada', desc: 'Configura Chrome corporativamente: página de inicio, políticas de seguridad, extensiones.' },
        { title: 'Exchange para Outlook en Android', desc: 'Configura automáticamente cuentas Exchange en la app Outlook.' },
        { title: 'Exchange para Gmail en Android', desc: 'Configura cuentas Exchange en la app Gmail de Google.' },
        { title: 'Cuentas IMAP para Samsung Email', desc: 'Configura cuentas IMAP/POP3 en la app de email de Samsung.', badge: 'Samsung' },
        { title: 'OpenVPN para Android', desc: 'Configura y despliega perfiles de OpenVPN en dispositivos gestionados.' },
        { title: 'Smart Switch en dispositivos Fully Managed', desc: 'Habilita Samsung Smart Switch para migración de datos en dispositivos corporativos.', badge: 'Samsung' },
        { title: 'Excluir apps de optimización de batería (Samsung)', desc: 'Mantén apps críticas activas en segundo plano en dispositivos Samsung.', badge: 'Samsung' },
      ]
    },
    {
      title: 'Samsung Knox Service Plugin',
      icon: <Shield className="w-4 h-4" />,
      items: [
        { title: 'Brillo de pantalla en Samsung (Knox)', desc: 'Configura y bloquea el nivel de brillo en dispositivos Samsung corporativos.', badge: 'Samsung' },
        { title: 'Configuración APN en Samsung (Knox)', desc: 'Despliega configuraciones de punto de acceso de datos móviles.', badge: 'Samsung' },
        { title: 'Bloquear llamadas salientes (Knox)', desc: 'Restringe llamadas a números específicos en dispositivos Samsung.', badge: 'Samsung' },
        { title: 'Deshabilitar Wi-Fi en Samsung (Knox)', desc: 'Fuerza el uso exclusivo de datos móviles deshabilitando Wi-Fi.', badge: 'Samsung' },
        { title: 'Bloquear envío de SMS (Knox)', desc: 'Impide que los usuarios envíen mensajes SMS en dispositivos corporativos.', badge: 'Samsung' },
        { title: 'Volumen de llamadas al 100% (Knox)', desc: 'Fija el volumen de llamadas al máximo, sin posibilidad de cambiarlo.', badge: 'Samsung' },
        { title: 'Deshabilitar aleatorización MAC Wi-Fi (Knox)', desc: 'Usa la MAC real del dispositivo para filtrado MAC en redes corporativas.', badge: 'Samsung' },
        { title: 'Filtrado de URLs a nivel de dispositivo (Knox)', desc: 'Bloquea sitios web a nivel del SO, independientemente del navegador usado.', badge: 'Samsung' },
      ]
    }
  ],
  acciones: [
    {
      title: 'Acciones Remotas',
      icon: <Zap className="w-4 h-4" />,
      items: [
        { title: 'Borrado remoto (Wipe)', desc: 'Borra todos los datos del dispositivo de forma remota. Útil para dispositivos robados o pérdidas. Irreversible.', badge: 'Crítico' },
        { title: 'Sonar alarma remotamente', desc: 'Activa una alarma sonora en el dispositivo para localizarlo físicamente, incluso en silencio.' },
        { title: 'Enviar mensaje al usuario', desc: 'Envía un mensaje de texto que aparece en la pantalla del dispositivo gestionado.' },
        { title: 'Fusionar dispositivos', desc: 'Combina el historial y datos de dos registros de dispositivo en uno solo.' },
        { title: 'Restablecimiento remoto de contraseña', desc: 'Limpia el PIN/patrón del dispositivo para que el usuario configure uno nuevo.' },
      ]
    }
  ],
  soporte: [
    {
      title: 'Solución de Problemas',
      icon: <Wrench className="w-4 h-4" />,
      items: [
        { title: 'Solución de problemas — Enrolamiento QR Fully Managed', desc: 'Pasos de diagnóstico cuando el QR de enrolamiento no funciona o el dispositivo no se une al MDM.' },
        { title: 'Solución de problemas — Enrolamiento Profile Owner', desc: 'Diagnóstico para problemas con enrolamiento de perfil de trabajo en dispositivos BYOD.' },
        { title: 'Solución de problemas — Despliegue de aplicaciones', desc: 'Por qué las apps no se instalan: errores comunes, compatibilidad y soluciones.' },
        { title: '¿Por qué los iconos de apps aparecen en gris?', desc: 'Causas y soluciones cuando los iconos de apps aparecen desactivados en el dispositivo.' },
        { title: 'Solución de problemas — Rastreo de ubicación Android', desc: 'El GPS no reporta ubicación: pasos para diagnosticar y resolver.' },
        { title: 'Errores típicos — Mail for Exchange en Samsung', desc: 'Problemas frecuentes al configurar Exchange en dispositivos Samsung y cómo resolverlos.', badge: 'Samsung' },
        { title: 'Recolección de logs ADB', desc: 'Cómo obtener logs detallados del dispositivo para diagnóstico avanzado.' },
      ]
    }
  ]
}

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'enrolamiento', label: 'Enrolamiento', icon: <QrCode className="w-4 h-4" /> },
  { key: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  { key: 'apps', label: 'Aplicaciones', icon: <Package className="w-4 h-4" /> },
  { key: 'acciones', label: 'Acciones Remotas', icon: <Zap className="w-4 h-4" /> },
  { key: 'soporte', label: 'Soporte', icon: <Wrench className="w-4 h-4" /> },
]

const GuideCard: React.FC<{ item: GuideItem }> = ({ item }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-palmas-dark rounded-lg border border-palmas-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-palmas-border/30 transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {item.icon && <span className="text-palmas-blue flex-shrink-0">{item.icon}</span>}
          <span className="text-white text-sm font-medium truncate">{item.title}</span>
          {item.badge && (
            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
              item.badge === 'Samsung' ? 'bg-blue-900/50 text-blue-300' :
              item.badge === 'Recomendado' ? 'bg-green-900/50 text-green-300' :
              item.badge === 'Crítico' ? 'bg-red-900/50 text-red-300' :
              item.badge === 'Requerido' ? 'bg-yellow-900/50 text-yellow-300' :
              'bg-palmas-green/20 text-palmas-blue'
            }`}>{item.badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-palmas-light flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-palmas-light flex-shrink-0 ml-2" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-palmas-border">
          <p className="text-palmas-light text-sm">{item.desc}</p>
        </div>
      )}
    </div>
  )
}

const Enrolamiento: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([])
  const [perfiles, setPerfiles] = useState<any[]>([])
  const [sede, setSede] = useState('Tulumayo')
  const [perfilId, setPerfilId] = useState<number | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [tokenActual, setTokenActual] = useState<Token | null>(null)
  const [generando, setGenerando] = useState(false)
  const [tab, setTab] = useState<Tab>('enrolamiento')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const headers = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

  const cargarTokens = async () => {
    try { const res = await axios.get(`${API}/enrolamiento/tokens`, headers()); setTokens(res.data) } catch {}
  }
  const cargarPerfiles = async () => {
    try { const res = await axios.get(`${API}/perfiles`, headers()); setPerfiles(res.data) } catch {}
  }

  useEffect(() => { cargarTokens(); cargarPerfiles() }, [])

  useEffect(() => {
    if (qrData && canvasRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(canvasRef.current!, qrData, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      })
    }
  }, [qrData])

  const generarToken = async () => {
    setGenerando(true)
    try {
      const res = await axios.post(`${API}/enrolamiento/generar`, { sede, perfil_id: perfilId }, headers())
      setQrData(res.data.qr_data); setTokenActual(res.data.token); cargarTokens()
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setGenerando(false) }
  }

  const verQR = async (id: number) => {
    try {
      const res = await axios.get(`${API}/enrolamiento/tokens/${id}/qr`, headers())
      setQrData(res.data.qr_data); setTokenActual(res.data.token); setTab('enrolamiento')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {}
  }

  const revocarToken = async (id: number) => {
    if (!window.confirm('¿Revocar este token?')) return
    try {
      await axios.delete(`${API}/enrolamiento/tokens/${id}`, headers())
      cargarTokens()
      if (tokenActual?.id === id) { setQrData(null); setTokenActual(null) }
    } catch {}
  }

  const descargarQR = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `qr-enrolamiento-${sede}-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const sections = GUIDES[tab] || []
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)

  return (
    <Layout titulo="Enrolamiento de Dispositivos">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-palmas-card rounded-xl p-1 border border-palmas-border overflow-x-auto">
        {TAB_CONFIG.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-palmas-green text-white'
                : 'text-palmas-light hover:text-white hover:bg-palmas-border'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Generador QR — solo visible en tab enrolamiento */}
      {tab === 'enrolamiento' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Generar QR */}
          <div className="space-y-4">
            <div className="bg-palmas-card rounded-xl p-6 border border-palmas-border">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-palmas-light" />
                <h3 className="text-white font-bold">Generar token de enrolamiento</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-palmas-light text-sm mb-2 block">Sede del dispositivo</label>
                  <select value={sede} onChange={e => setSede(e.target.value)}
                    className="w-full bg-palmas-dark border border-palmas-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green">
                    {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-palmas-light text-sm mb-2 block">Perfil de políticas</label>
                  <select value={perfilId ?? ''} onChange={e => setPerfilId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-palmas-dark border border-palmas-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green">
                    <option value="">Sin perfil (políticas por defecto)</option>
                    {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <button onClick={generarToken} disabled={generando}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-palmas-green text-white rounded-lg font-bold hover:bg-palmas-accent transition-all disabled:opacity-50">
                  <QrCode className="w-5 h-5" />
                  {generando ? 'Generando...' : 'Generar QR de enrolamiento'}
                </button>
              </div>
            </div>
            {qrData && (
              <div className="bg-palmas-card rounded-xl p-6 border border-palmas-border text-center">
                <h4 className="text-white font-bold mb-1">Escanear con dispositivo nuevo</h4>
                <p className="text-palmas-light text-xs mb-4">Escanea durante el setup inicial del dispositivo (pantalla de bienvenida)</p>
                <div className="flex justify-center mb-4 bg-white p-3 rounded-xl inline-block mx-auto">
                  <canvas ref={canvasRef} className="rounded" />
                </div>
                <p className="text-palmas-light text-xs mb-4">
                  Sede: <span className="text-white">{tokenActual?.sede}</span>
                  {tokenActual?.perfil_nombre && <> &nbsp;·&nbsp; Perfil: <span className="text-white">{tokenActual.perfil_nombre}</span></>}
                  <br />Expira: <span className="text-white">{tokenActual ? new Date(tokenActual.expira_en).toLocaleString('es-PE') : ''}</span>
                </p>
                <button onClick={descargarQR}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-palmas-dark border border-palmas-border text-palmas-light rounded-lg hover:text-white transition-all text-sm">
                  <Download className="w-4 h-4" /> Descargar QR
                </button>
              </div>
            )}
          </div>

          {/* Tokens activos */}
          <div className="bg-palmas-card rounded-xl p-6 border border-palmas-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-palmas-light" />
                <h3 className="text-white font-bold">Tokens activos</h3>
                <span className="text-xs bg-palmas-green/20 text-palmas-blue px-2 py-0.5 rounded">{tokens.length}</span>
              </div>
              <button onClick={cargarTokens} className="text-palmas-light hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-80">
              {tokens.length === 0 && <p className="text-palmas-light text-sm text-center py-8">No hay tokens generados</p>}
              {tokens.map(t => (
                <div key={t.id} className="bg-palmas-dark rounded-lg p-4 border border-palmas-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {t.usado ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                        <span className="text-white text-sm font-medium">{t.sede}</span>
                        {t.perfil_nombre && <span className="text-xs bg-palmas-green/20 text-palmas-blue px-2 py-0.5 rounded">{t.perfil_nombre}</span>}
                      </div>
                      <p className="text-palmas-light text-xs font-mono">{t.token.substring(0, 18)}...</p>
                      <p className="text-palmas-light text-xs mt-1">
                        {t.usado ? `✅ Usado${t.dispositivo_imei ? ' por ' + t.dispositivo_imei : ''}` : `⏳ Expira ${new Date(t.expira_en).toLocaleString('es-PE')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {!t.usado && (
                        <button onClick={() => verQR(t.id)} className="text-palmas-light hover:text-palmas-blue transition-all" title="Ver QR">
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => revocarToken(t.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Guía de opciones */}
      <div className="bg-palmas-card rounded-xl border border-palmas-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-palmas-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">
              {TAB_CONFIG.find(t => t.key === tab)?.label} — Referencia
            </h3>
          </div>
          <span className="text-xs text-palmas-light bg-palmas-border px-3 py-1 rounded-full">{totalItems} opciones</span>
        </div>
        <div className="p-6 space-y-8">
          {sections.map((section, si) => (
            <div key={si}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-palmas-blue">{section.icon}</span>
                <h4 className="text-white font-semibold text-sm">{section.title}</h4>
                <span className="text-xs text-palmas-light">({section.items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {section.items.map((item, ii) => <GuideCard key={ii} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Enrolamiento
