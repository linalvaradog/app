import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/layout/Layout'
import { QrCode, RefreshCw, Trash2, Clock, CheckCircle, Download } from 'lucide-react'
import axios from 'axios'

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'

interface Token {
  id: number
  token: string
  sede: string
  perfil_id: number | null
  perfil_nombre: string | null
  creado_en: string
  expira_en: string
  usado: boolean
  dispositivo_imei: string | null
}

const SEDES = ['Tulumayo', 'Shanusi', 'Palmawasi', 'Nuevo Horizonte', 'Lima']

const Enrolamiento: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([])
  const [perfiles, setPerfiles] = useState<any[]>([])
  const [sede, setSede] = useState('Tulumayo')
  const [perfilId, setPerfilId] = useState<number | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [tokenActual, setTokenActual] = useState<Token | null>(null)
  const [generando, setGenerando] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const headers = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

  const cargarTokens = async () => {
    try {
      const res = await axios.get(`${API}/enrolamiento/tokens`, headers())
      setTokens(res.data)
    } catch {}
  }

  const cargarPerfiles = async () => {
    try {
      const res = await axios.get(`${API}/perfiles`, headers())
      setPerfiles(res.data)
    } catch {}
  }

  useEffect(() => { cargarTokens(); cargarPerfiles() }, [])

  useEffect(() => {
    if (qrData && canvasRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(canvasRef.current!, qrData, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        })
      })
    }
  }, [qrData])

  const generarToken = async () => {
    setGenerando(true)
    try {
      const res = await axios.post(`${API}/enrolamiento/generar`, { sede, perfil_id: perfilId }, headers())
      setQrData(res.data.qr_data)
      setTokenActual(res.data.token)
      cargarTokens()
    } catch (e: any) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally {
      setGenerando(false)
    }
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

  return (
    <Layout titulo="Enrolamiento de Dispositivos">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Generar QR */}
        <div className="space-y-6">
          <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
            <div className="flex items-center gap-2 mb-6">
              <QrCode className="w-5 h-5 text-palmas-light" />
              <h3 className="text-white font-bold">Generar token de enrolamiento</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-palmas-light text-sm mb-2 block">Sede del dispositivo</label>
                <select
                  value={sede}
                  onChange={e => setSede(e.target.value)}
                  className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green"
                >
                  {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-palmas-light text-sm mb-2 block">Perfil de políticas</label>
                <select
                  value={perfilId ?? ''}
                  onChange={e => setPerfilId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green"
                >
                  <option value="">Sin perfil (políticas por defecto)</option>
                  {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <button
                onClick={generarToken}
                disabled={generando}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-palmas-green text-white rounded-lg font-bold hover:bg-palmas-accent transition-all disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                {generando ? 'Generando...' : 'Generar QR de enrolamiento'}
              </button>
            </div>
          </div>

          {qrData && (
            <div className="bg-palmas-card rounded-xl p-6 border border-green-900 text-center">
              <h4 className="text-white font-bold mb-1">Escanear con dispositivo nuevo</h4>
              <p className="text-palmas-light text-xs mb-4">
                Escanea durante el setup inicial del dispositivo (pantalla de bienvenida)
              </p>
              <div className="flex justify-center mb-4 bg-white p-3 rounded-xl inline-block mx-auto">
                <canvas ref={canvasRef} className="rounded" />
              </div>
              <p className="text-palmas-light text-xs mb-4">
                Sede: <span className="text-white">{tokenActual?.sede}</span>
                {tokenActual?.perfil_nombre && <> &nbsp;·&nbsp; Perfil: <span className="text-white">{tokenActual.perfil_nombre}</span></>}
                <br />
                Expira: <span className="text-white">{tokenActual ? new Date(tokenActual.expira_en).toLocaleString('es-PE') : ''}</span>
              </p>
              <button
                onClick={descargarQR}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-palmas-dark border border-green-900 text-palmas-light rounded-lg hover:text-white transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar QR
              </button>
            </div>
          )}
        </div>

        {/* Tokens activos */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-palmas-light" />
              <h3 className="text-white font-bold">Tokens activos</h3>
              <span className="text-xs bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">{tokens.length}</span>
            </div>
            <button onClick={cargarTokens} className="text-palmas-light hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {tokens.length === 0 && (
              <p className="text-palmas-light text-sm text-center py-8">No hay tokens generados</p>
            )}
            {tokens.map(t => (
              <div key={t.id} className="bg-palmas-dark rounded-lg p-4 border border-green-900">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {t.usado
                        ? <CheckCircle className="w-4 h-4 text-palmas-green flex-shrink-0" />
                        : <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      }
                      <span className="text-white text-sm font-medium">{t.sede}</span>
                      {t.perfil_nombre && (
                        <span className="text-xs bg-palmas-green/20 text-palmas-green px-2 py-0.5 rounded">
                          {t.perfil_nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-palmas-light text-xs font-mono">{t.token.substring(0, 18)}...</p>
                    <p className="text-palmas-light text-xs mt-1">
                      {t.usado
                        ? `✅ Usado${t.dispositivo_imei ? ' por ' + t.dispositivo_imei : ''}`
                        : `⏳ Expira ${new Date(t.expira_en).toLocaleString('es-PE')}`
                      }
                    </p>
                  </div>
                  <button onClick={() => revocarToken(t.id)} className="text-red-400 hover:text-red-300 ml-3 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Enrolamiento
