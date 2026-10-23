import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import { getDispositivo, getAlertas, bloquearDispositivo, borrarDispositivo, enviarComando } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { Dispositivo, Alerta } from '../types'
import {
  Smartphone,
  ArrowLeft,
  Lock,
  Trash2,
  MapPin,
  User,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Power,
  Wifi,
  WifiOff,
  Bell,
  Clock
} from 'lucide-react'

const DetalleDispositivo: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState('')
  const [conectado, setConectado] = useState(false)
  const [ultimaActividad, setUltimaActividad] = useState<string | null>(null)

  useWebSocket((evento, datos) => {
    if (!dispositivo) return
    if (evento === 'dispositivo_actualizado' && datos.imei === dispositivo.imei) {
      setConectado(true)
      setUltimaActividad(new Date().toLocaleTimeString())
      setDispositivo(prev => prev ? {
        ...prev,
        estado: datos.estado,
        ultimaConexion: new Date().toLocaleString()
      } : prev)
    }
    if (evento === 'nueva_alerta' && datos.imei === dispositivo.imei) {
      cargarAlertas()
    }
  })

  useEffect(() => {
    cargarDispositivo()
    cargarAlertas()
  }, [id])

  const cargarDispositivo = async () => {
    try {
      const data = await getDispositivo(id!)
      setDispositivo(data)
    } catch {
      setDispositivo({
        id: id || '1',
        imei: '356253244400797',
        serial: 'R8YL610L9XY',
        modelo: 'SM-A075M',
        fabricante: 'Samsung',
        android: 'Android 16',
        sede: 'Tulumayo',
        estado: 'activo',
        deviceOwner: true,
        ultimaConexion: '2026-10-20 10:30',
        colaborador: {
          nombre: 'Juan Pérez',
          dni: '12345678',
          area: 'Operaciones',
          puesto: 'Técnico'
        },
        politicas: {
          instalacionBloqueada: true,
          factoryResetBloqueado: true,
          usbDebuggingBloqueado: true,
          pinRequerido: true
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarAlertas = async () => {
    try {
      const data = await getAlertas()
      setAlertas(data.filter((a: Alerta) => a.dispositivoId === id).slice(0, 5))
    } catch {
      setAlertas([])
    }
  }

  const ejecutarComando = async (comando: string, mensaje: string) => {
    if (!window.confirm(mensaje)) return
    setAccion(comando)
    try {
      await enviarComando(id!, comando)
    } catch {
    } finally {
      setTimeout(() => setAccion(''), 2000)
    }
  }

  if (loading) return (
    <Layout titulo="Detalle de dispositivo">
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-palmas-green border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  if (!dispositivo) return (
    <Layout titulo="Detalle de dispositivo">
      <p className="text-palmas-light">Dispositivo no encontrado</p>
    </Layout>
  )

  return (
    <Layout titulo="Detalle de dispositivo">

      {/* Volver */}
      <button
        onClick={() => navigate('/dispositivos')}
        className="flex items-center gap-2 text-palmas-light hover:text-white mb-6 transition-all text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a dispositivos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header dispositivo */}
          <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-palmas-dark rounded-xl flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-palmas-light" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {dispositivo.fabricante} {dispositivo.modelo}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {dispositivo.deviceOwner && (
                      <span className="text-xs bg-palmas-green text-white px-2 py-0.5 rounded-full">
                        Device Owner
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      dispositivo.estado === 'activo'
                        ? 'bg-green-900 text-green-400'
                        : dispositivo.estado === 'bloqueado'
                        ? 'bg-red-900 text-red-400'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {dispositivo.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador conexión MQTT */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                conectado ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                {conectado
                  ? <><Wifi className="w-3 h-3" /> En línea</>
                  : <><WifiOff className="w-3 h-3" /> Sin señal</>
                }
                {ultimaActividad && (
                  <span className="text-green-600">· {ultimaActividad}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'IMEI', value: dispositivo.imei },
                { label: 'Serial', value: dispositivo.serial },
                { label: 'Android', value: dispositivo.android },
                { label: 'Última conexión', value: dispositivo.ultimaConexion },
              ].map(item => (
                <div key={item.label} className="bg-palmas-dark rounded-lg p-3">
                  <p className="text-palmas-light text-xs mb-1">{item.label}</p>
                  <p className="text-white text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Colaborador */}
          {dispositivo.colaborador && (
            <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-palmas-light" />
                <h3 className="text-white font-semibold text-sm">Colaborador asignado</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nombre', value: dispositivo.colaborador.nombre },
                  { label: 'DNI', value: dispositivo.colaborador.dni },
                  { label: 'Área', value: dispositivo.colaborador.area },
                  { label: 'Puesto', value: dispositivo.colaborador.puesto },
                ].map(item => (
                  <div key={item.label} className="bg-palmas-dark rounded-lg p-3">
                    <p className="text-palmas-light text-xs mb-1">{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 bg-palmas-dark rounded-lg p-3">
                <MapPin className="w-4 h-4 text-palmas-light" />
                <div>
                  <p className="text-palmas-light text-xs">Sede</p>
                  <p className="text-white text-sm font-medium">{dispositivo.sede}</p>
                </div>
              </div>
            </div>
          )}

          {/* Políticas */}
          <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-palmas-light" />
              <h3 className="text-white font-semibold text-sm">Políticas de seguridad</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Instalación de apps bloqueada', activo: dispositivo.politicas.instalacionBloqueada },
                { label: 'Factory reset bloqueado', activo: dispositivo.politicas.factoryResetBloqueado },
                { label: 'USB Debugging bloqueado', activo: dispositivo.politicas.usbDebuggingBloqueado },
                { label: 'PIN mínimo requerido', activo: dispositivo.politicas.pinRequerido },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between bg-palmas-dark rounded-lg px-4 py-3">
                  <span className="text-palmas-light text-sm">{p.label}</span>
                  {p.activo
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Historial de alertas */}
          <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-palmas-light" />
              <h3 className="text-white font-semibold text-sm">Últimas alertas</h3>
            </div>
            {alertas.length === 0 ? (
              <p className="text-palmas-light text-sm text-center py-4">Sin alertas recientes</p>
            ) : (
              <div className="space-y-2">
                {alertas.map(alerta => (
                  <div key={alerta.id} className={`flex items-start gap-3 bg-palmas-dark rounded-lg p-3 ${
                    !alerta.leida ? 'border-l-2 border-yellow-500' : ''
                  }`}>
                    <Bell className={`w-4 h-4 mt-0.5 ${!alerta.leida ? 'text-yellow-400' : 'text-gray-600'}`} />
                    <div className="flex-1">
                      <p className="text-white text-xs">{alerta.mensaje}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-green-800" />
                        <p className="text-green-800 text-xs">{alerta.fecha}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha — Comandos */}
        <div>
          <div className="bg-palmas-card rounded-xl p-6 border border-green-900 sticky top-6">
            <h3 className="text-white font-semibold text-sm mb-4">Comandos remotos</h3>
            <div className="space-y-2">

              <button
                onClick={() => ejecutarComando('lock', '¿Bloquear pantalla ahora?')}
                disabled={accion !== ''}
                className="w-full flex items-center gap-3 px-4 py-3 bg-palmas-dark rounded-lg text-palmas-light hover:text-white hover:bg-blue-900 transition-all disabled:opacity-50 text-sm"
              >
                <Lock className="w-4 h-4" />
                {accion === 'lock' ? 'Enviando...' : 'Bloquear pantalla'}
              </button>

              <button
                onClick={() => ejecutarComando('refresh', '¿Sincronizar políticas?')}
                disabled={accion !== ''}
                className="w-full flex items-center gap-3 px-4 py-3 bg-palmas-dark rounded-lg text-palmas-light hover:text-white hover:bg-palmas-green transition-all disabled:opacity-50 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {accion === 'refresh' ? 'Enviando...' : 'Sincronizar políticas'}
              </button>

              <button
                onClick={() => ejecutarComando('reboot', '¿Reiniciar el dispositivo?')}
                disabled={accion !== ''}
                className="w-full flex items-center gap-3 px-4 py-3 bg-palmas-dark rounded-lg text-palmas-light hover:text-white hover:bg-yellow-800 transition-all disabled:opacity-50 text-sm"
              >
                <Power className="w-4 h-4" />
                {accion === 'reboot' ? 'Enviando...' : 'Reiniciar dispositivo'}
              </button>

              <div className="border-t border-green-900 pt-2 mt-2">
                <button
                  onClick={() => ejecutarComando('wipe', '⚠️ ¿Borrar TODOS los datos? No se puede deshacer.')}
                  disabled={accion !== ''}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-palmas-dark rounded-lg text-red-400 hover:text-white hover:bg-red-900 transition-all disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {accion === 'wipe' ? 'Enviando...' : 'Borrado total'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DetalleDispositivo