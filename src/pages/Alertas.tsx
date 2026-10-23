import React, { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getAlertas, marcarAlertaLeida } from '../services/api'
import { Alerta } from '../types'
import {
  Bell,
  AlertTriangle,
  Download,
  Shield,
  Key,
  CheckCircle
} from 'lucide-react'

const Alertas: React.FC = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarAlertas()
  }, [])

  const cargarAlertas = async () => {
    try {
      const data = await getAlertas()
      setAlertas(data)
    } catch {
      setAlertas([
        {
          id: '1',
          dispositivoId: '1',
          tipo: 'instalacion',
          mensaje: 'Intento de instalación detectado en Samsung SM-A075M — Tulumayo',
          fecha: '2026-10-20 10:45',
          leida: false
        },
        {
          id: '2',
          dispositivoId: '2',
          tipo: 'acceso_admin',
          mensaje: 'Acceso al panel de administrador en Moto E30 — Shanusi',
          fecha: '2026-10-20 09:30',
          leida: false
        },
        {
          id: '3',
          dispositivoId: '1',
          tipo: 'depuracion',
          mensaje: 'Depuración USB detectada en Samsung SM-A075M — Tulumayo',
          fecha: '2026-10-19 16:20',
          leida: true
        },
        {
          id: '4',
          dispositivoId: '3',
          tipo: 'root',
          mensaje: 'Root detectado en dispositivo ZTE Z2450 — Palmawasi',
          fecha: '2026-10-19 14:10',
          leida: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarLeida = async (id: string) => {
    try {
      await marcarAlertaLeida(id)
      setAlertas(prev => prev.map(a =>
        a.id === id ? { ...a, leida: true } : a
      ))
    } catch {
      setAlertas(prev => prev.map(a =>
        a.id === id ? { ...a, leida: true } : a
      ))
    }
  }

  const handleMarcarTodasLeidas = () => {
    setAlertas(prev => prev.map(a => ({ ...a, leida: true })))
  }

  const iconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'instalacion': return <Download className="w-5 h-5 text-yellow-400" />
      case 'root': return <Shield className="w-5 h-5 text-red-400" />
      case 'depuracion': return <AlertTriangle className="w-5 h-5 text-orange-400" />
      case 'acceso_admin': return <Key className="w-5 h-5 text-blue-400" />
      default: return <Bell className="w-5 h-5 text-palmas-light" />
    }
  }

  const colorTipo = (tipo: string) => {
    switch (tipo) {
      case 'instalacion': return 'border-yellow-600'
      case 'root': return 'border-red-600'
      case 'depuracion': return 'border-orange-600'
      case 'acceso_admin': return 'border-blue-600'
      default: return 'border-green-900'
    }
  }

  const pendientes = alertas.filter(a => !a.leida).length

  return (
    <Layout titulo="Alertas" alertas={pendientes}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-palmas-light text-sm">
            {pendientes} alerta{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''}
          </p>
        </div>
        {pendientes > 0 && (
          <button
            onClick={handleMarcarTodasLeidas}
            className="flex items-center gap-2 px-4 py-2 bg-palmas-green text-white rounded-lg text-sm hover:bg-palmas-accent transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-palmas-light">Cargando alertas...</p>
        </div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Bell className="w-12 h-12 text-green-900 mb-4" />
          <p className="text-palmas-light">No hay alertas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map(alerta => (
            <div
              key={alerta.id}
              className={`bg-palmas-card rounded-xl p-5 border-l-4 ${colorTipo(alerta.tipo)} border border-green-900 ${
                !alerta.leida ? 'opacity-100' : 'opacity-60'
              } transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {iconoTipo(alerta.tipo)}
                  </div>
                  <div>
                    <p className={`text-sm ${!alerta.leida ? 'text-white font-medium' : 'text-palmas-light'}`}>
                      {alerta.mensaje}
                    </p>
                    <p className="text-green-800 text-xs mt-1">{alerta.fecha}</p>
                  </div>
                </div>

                {!alerta.leida && (
                  <button
                    onClick={() => handleMarcarLeida(alerta.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-palmas-dark text-palmas-light hover:text-white hover:bg-palmas-green rounded-lg text-xs transition-all whitespace-nowrap ml-4"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

export default Alertas