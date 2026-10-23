
import React, { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getDispositivos } from '../services/api'
import { Dispositivo } from '../types'
import {
  User,
  Search,
  Smartphone,
  MapPin,
  CreditCard
} from 'lucide-react'

const Colaboradores: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const data = await getDispositivos()
      setDispositivos(data.filter(d => d.colaborador))
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

  const filtrados = dispositivos.filter(d =>
    filtro === '' ||
    d.colaborador?.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    d.colaborador?.dni.includes(filtro) ||
    d.colaborador?.area.toLowerCase().includes(filtro.toLowerCase()) ||
    d.sede.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <Layout titulo="Colaboradores">

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-palmas-light" />
        <input
          type="text"
          placeholder="Buscar por nombre, DNI, área o sede..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full bg-palmas-card border border-green-900 rounded-lg pl-10 pr-4 py-3 text-white placeholder-green-800 focus:outline-none focus:border-palmas-green"
        />
      </div>

      <p className="text-palmas-light text-sm mb-4">
        {filtrados.length} colaborador{filtrados.length !== 1 ? 'es' : ''} con dispositivo asignado
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-palmas-light">Cargando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(dispositivo => (
            <div
              key={dispositivo.id}
              className="bg-palmas-card rounded-xl p-5 border border-green-900 hover:border-palmas-green transition-all"
            >
              {/* Avatar y nombre */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-palmas-green flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {dispositivo.colaborador?.nombre.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {dispositivo.colaborador?.nombre}
                  </h3>
                  <p className="text-palmas-light text-xs">
                    {dispositivo.colaborador?.puesto}
                  </p>
                </div>
              </div>

              {/* Datos */}
              <div className="space-y-2 border-t border-green-900 pt-4">
                <div className="flex items-center gap-2 text-palmas-light text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>DNI: {dispositivo.colaborador?.dni}</span>
                </div>
                <div className="flex items-center gap-2 text-palmas-light text-sm">
                  <User className="w-4 h-4" />
                  <span>{dispositivo.colaborador?.area}</span>
                </div>
                <div className="flex items-center gap-2 text-palmas-light text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{dispositivo.sede}</span>
                </div>
                <div className="flex items-center gap-2 text-palmas-light text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>{dispositivo.fabricante} {dispositivo.modelo}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="mt-4 pt-3 border-t border-green-900">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  dispositivo.estado === 'activo'
                    ? 'bg-palmas-green text-white'
                    : dispositivo.estado === 'bloqueado'
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {dispositivo.estado.charAt(0).toUpperCase() + dispositivo.estado.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

export default Colaboradores