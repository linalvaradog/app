import React, { useState } from 'react'
import Layout from '../components/layout/Layout'
import {
  Settings,
  Shield,
  Bell,
  Server,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

const Configuracion: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(
    process.env.REACT_APP_API_URL || 'http://localhost:8000'
  )
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notifInstalacion, setNotifInstalacion] = useState(true)
  const [notifRoot, setNotifRoot] = useState(true)
  const [notifDepuracion, setNotifDepuracion] = useState(true)
  const [guardado, setGuardado] = useState(false)

  const handleGuardar = () => {
    localStorage.setItem('api_url', apiUrl)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  return (
    <Layout titulo="Configuración">
      <div className="max-w-2xl space-y-6">

        {/* Conexión al servidor */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Conexión al servidor</h3>
          </div>

          <div>
            <label className="text-palmas-light text-sm mb-2 block">
              URL del servidor MDM
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green"
              placeholder="http://192.168.1.100:8000"
            />
            <p className="text-green-800 text-xs mt-2">
              IP del servidor Linux on premise de Grupo Palmas
            </p>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Seguridad</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-palmas-light text-sm mb-2 block">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green pr-10"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-palmas-light"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-palmas-light text-sm mb-2 block">
                Nueva contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-palmas-green"
                placeholder="••••••••"
              />
            </div>

            <button className="px-4 py-2 bg-palmas-green text-white rounded-lg text-sm hover:bg-palmas-accent transition-all">
              Cambiar contraseña
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Notificaciones</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                label: 'Intento de instalación de apps',
                value: notifInstalacion,
                setter: setNotifInstalacion
              },
              {
                label: 'Root detectado',
                value: notifRoot,
                setter: setNotifRoot
              },
              {
                label: 'Depuración USB detectada',
                value: notifDepuracion,
                setter: setNotifDepuracion
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-palmas-light text-sm">{item.label}</span>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`w-12 h-6 rounded-full transition-all duration-200 ${
                    item.value ? 'bg-palmas-green' : 'bg-palmas-dark'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    item.value ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Información */}
        <div className="bg-palmas-card rounded-xl p-6 border border-green-900">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-palmas-light" />
            <h3 className="text-white font-bold">Información del sistema</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-palmas-light">Versión</span>
              <span className="text-white">Grupo Palmas MDM v1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-palmas-light">Desarrollado por</span>
              <span className="text-white">TI Corporativo — Grupo Palmas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-palmas-light">Entorno</span>
              <span className="text-white">On Premise — Tulumayo</span>
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleGuardar}
          className="flex items-center gap-2 px-6 py-3 bg-palmas-green text-white rounded-lg font-bold hover:bg-palmas-accent transition-all"
        >
          <Save className="w-5 h-5" />
          {guardado ? '✅ Guardado' : 'Guardar cambios'}
        </button>

      </div>
    </Layout>
  )
}

export default Configuracion