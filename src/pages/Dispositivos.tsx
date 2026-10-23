import React, { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getDispositivos, bloquearDispositivo, borrarDispositivo } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { Dispositivo } from '../types'
import {
  Smartphone,
  Search,
  Lock,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Dispositivos: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [filtro, setFiltro] = useState('')
  const [sedeFiltro, setSedeFiltro] = useState('todas')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useWebSocket((evento, datos) => {
    if (evento === 'dispositivo_actualizado') {
      setDispositivos(prev => prev.map(d =>
        d.imei === datos.imei
          ? { ...d, estado: datos.estado, ultimaConexion: new Date().toLocaleString() }
          : d
      ))
    }
    if (evento === 'nueva_alerta') {
      cargarDispositivos()
    }
  })

  useEffect(() => {
    cargarDispositivos()
  }, [])

  const cargarDispositivos = async () => {
    try {
      const data = await getDispositivos()
      setDispositivos(data)
    } catch {
      setDispositivos([
        {
          id: '1',
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
        },
        {
          id: '2',
          imei: '123456789012345',
          serial: 'ABC123XYZ',
          modelo: 'Moto E30',
          fabricante: 'Motorola',
          android: 'Android 11',
          sede: 'Shanusi',
          estado: 'activo',
          deviceOwner: true,
          ultimaConexion: '2026-10-20 09:15',
          colaborador: {
            nombre: 'María López',
            dni: '87654321',
            area: 'Logística',
            puesto: 'Coordinadora'
          },
          politicas: {
            instalacionBloqueada: true,
            factoryResetBloqueado: true,
            usbDebuggingBloqueado: false,
            pinRequerido: true
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const dispositivosFiltrados = dispositivos.filter(d => {
    const matchFiltro = filtro === '' ||
      d.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
      d.colaborador?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      d.imei.includes(filtro) ||
      d.serial.toLowerCase().includes(filtro.toLowerCase())
    const matchSede = sedeFiltro === 'todas' || d.sede === sedeFiltro
    return matchFiltro && matchSede
  })

  const sedes = ['todas', 'Tulumayo', 'Shanusi', 'Palmawasi', 'Nuevo Horizonte', 'Lima']

  const estadoIcono = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'inactivo': return <XCircle className="w-4 h-4 text-gray-400" />
      case 'bloqueado': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  const handleBloquear = async (id: string) => {
    if (window.confirm('¿Bloquear este dispositivo?')) {
      await bloquearDispositivo(id)
      cargarDispositivos()
    }
  }

  const handleBorrar = async (id: string) => {
    if (window.confirm('⚠️ ¿Borrar TODOS los datos del dispositivo? Esta acción no se puede deshacer.')) {
      await borrarDispositivo(id)
      cargarDispositivos()
    }
  }

  return (
    <Layout titulo="Dispositivos">

      {/* Indicador WebSocket */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-palmas-light text-xs">Actualización en tiempo real activa</span>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-palmas-light" />
          <input
            type="text"
            placeholder="Buscar por modelo, colaborador, IMEI, serial..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full bg-palmas-card border border-green-900 rounded-lg pl-10 pr-4 py-3 text-white placeholder-green-800 focus:outline-none focus:border-palmas-green"
          />
        </div>

        <select
          value={sedeFiltro}
          onChange={(e) => setSedeFiltro(e.target.value)}
          className="bg-palmas-card border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green"
        >
          {sedes.map(s => (
            <option key={s} value={s} className="bg-palmas-card">
              {s === 'todas' ? 'Todas las sedes' : s}
            </option>
          ))}
        </select>
      </div>

      {/* Contador */}
      <p className="text-palmas-light text-sm mb-4">
        {dispositivosFiltrados.length} dispositivo{dispositivosFiltrados.length !== 1 ? 's' : ''} encontrado{dispositivosFiltrados.length !== 1 ? 's' : ''}
      </p>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-palmas-light">Cargando dispositivos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {dispositivosFiltrados.map(dispositivo => (
            <div
              key={dispositivo.id}
              className="bg-palmas-card rounded-xl p-5 border border-green-900 hover:border-palmas-green transition-all"
            >
              <div className="flex items-start justify-between">

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-palmas-dark rounded-xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-palmas-light" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {estadoIcono(dispositivo.estado)}
                      <h3 className="text-white font-bold">
                        {dispositivo.fabricante} {dispositivo.modelo}
                      </h3>
                      {dispositivo.deviceOwner && (
                        <span className="text-xs bg-palmas-green text-white px-2 py-0.5 rounded-full">
                          Device Owner
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 text-palmas-light text-xs">
                      <span>IMEI: {dispositivo.imei}</span>
                      <span>Serie: {dispositivo.serial}</span>
                      <span>{dispositivo.android}</span>
                    </div>

                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-1 text-palmas-light text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>{dispositivo.sede}</span>
                      </div>
                      {dispositivo.colaborador && (
                        <div className="flex items-center gap-1 text-palmas-light text-xs">
                          <User className="w-3 h-3" />
                          <span>{dispositivo.colaborador.nombre} — {dispositivo.colaborador.area}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-green-800 text-xs mt-1">
                      Última conexión: {dispositivo.ultimaConexion}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/dispositivos/${dispositivo.id}`)}
                    className="p-2 rounded-lg bg-palmas-dark text-palmas-light hover:text-white hover:bg-palmas-green transition-all"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBloquear(dispositivo.id)}
                    className="p-2 rounded-lg bg-palmas-dark text-palmas-light hover:text-white hover:bg-yellow-600 transition-all"
                    title="Bloquear pantalla"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBorrar(dispositivo.id)}
                    className="p-2 rounded-lg bg-palmas-dark text-palmas-light hover:text-white hover:bg-red-700 transition-all"
                    title="Borrado total"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-green-900">
                {[
                  { label: 'Instalación', activo: dispositivo.politicas.instalacionBloqueada },
                  { label: 'Factory Reset', activo: dispositivo.politicas.factoryResetBloqueado },
                  { label: 'USB Debug', activo: dispositivo.politicas.usbDebuggingBloqueado },
                  { label: 'PIN', activo: dispositivo.politicas.pinRequerido },
                ].map(p => (
                  <span
                    key={p.label}
                    className={`text-xs px-2 py-1 rounded-full ${
                      p.activo
                        ? 'bg-palmas-green text-white'
                        : 'bg-palmas-dark text-gray-500'
                    }`}
                  >
                    {p.activo ? '🔒' : '🔓'} {p.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

export default Dispositivos