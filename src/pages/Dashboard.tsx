import React, { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { getDashboard } from '../services/api'
import { EstadisticasDashboard } from '../types'
import {
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  MapPin
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<EstadisticasDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const data = await getDashboard()
      setStats(data)
    } catch {
      // Datos de ejemplo mientras no hay backend
      setStats({
        totalDispositivos: 12,
        dispositivosActivos: 9,
        dispositivosInactivos: 2,
        dispositivosBloqueados: 1,
        alertasPendientes: 3,
        dispositivosPorSede: [
          { sede: 'Tulumayo', cantidad: 5 },
          { sede: 'Shanusi', cantidad: 3 },
          { sede: 'Palmawasi', cantidad: 2 },
          { sede: 'Nuevo Horizonte', cantidad: 1 },
          { sede: 'Lima', cantidad: 1 },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Layout titulo="Dashboard">
      <div className="flex items-center justify-center h-64">
        <p className="text-palmas-light">Cargando...</p>
      </div>
    </Layout>
  )

  return (
    <Layout titulo="Dashboard" alertas={stats?.alertasPendientes}>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

        <div className="bg-palmas-card rounded-xl p-5 border border-green-900">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone className="w-5 h-5 text-palmas-light" />
            <span className="text-palmas-light text-xs">Total</span>
          </div>
          <p className="text-white text-3xl font-bold">{stats?.totalDispositivos}</p>
          <p className="text-palmas-light text-xs mt-1">Dispositivos</p>
        </div>

        <div className="bg-palmas-card rounded-xl p-5 border border-green-900">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-palmas-light text-xs">Activos</span>
          </div>
          <p className="text-green-400 text-3xl font-bold">{stats?.dispositivosActivos}</p>
          <p className="text-palmas-light text-xs mt-1">En línea</p>
        </div>

        <div className="bg-palmas-card rounded-xl p-5 border border-green-900">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <span className="text-palmas-light text-xs">Inactivos</span>
          </div>
          <p className="text-gray-400 text-3xl font-bold">{stats?.dispositivosInactivos}</p>
          <p className="text-palmas-light text-xs mt-1">Sin conexión</p>
        </div>

        <div className="bg-palmas-card rounded-xl p-5 border border-green-900">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-palmas-light text-xs">Bloqueados</span>
          </div>
          <p className="text-red-400 text-3xl font-bold">{stats?.dispositivosBloqueados}</p>
          <p className="text-palmas-light text-xs mt-1">Restringidos</p>
        </div>

        <div className="bg-palmas-card rounded-xl p-5 border border-green-900">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            <span className="text-palmas-light text-xs">Alertas</span>
          </div>
          <p className="text-yellow-400 text-3xl font-bold">{stats?.alertasPendientes}</p>
          <p className="text-palmas-light text-xs mt-1">Pendientes</p>
        </div>
      </div>

      {/* Gráfico por sede */}
      <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-palmas-light" />
          <h3 className="text-white font-bold">Dispositivos por sede</h3>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats?.dispositivosPorSede}>
            <XAxis
              dataKey="sede"
              tick={{ fill: '#81C784', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#81C784', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A2E1C',
                border: '1px solid #2E7D32',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
              {stats?.dispositivosPorSede.map((_, index) => (
                <Cell key={index} fill="#2E7D32" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  )
}

export default Dashboard