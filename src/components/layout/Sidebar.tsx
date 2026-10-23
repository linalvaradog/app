import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Smartphone,
  Bell,
  Users,
  Settings,
  Shield,
  LogOut
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dispositivos', icon: Smartphone, label: 'Dispositivos' },
  { path: '/alertas', icon: Bell, label: 'Alertas' },
  { path: '/colaboradores', icon: Users, label: 'Colaboradores' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
]

const Sidebar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col w-64 min-h-screen bg-palmas-card border-r border-green-900">
      
      {/* Logo */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-green-900">
        <div className="w-16 h-16 bg-palmas-green rounded-full flex items-center justify-center mb-3">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-white font-bold text-lg">Grupo Palmas</h1>
        <p className="text-palmas-light text-xs">MDM Console</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-palmas-green text-white'
                  : 'text-palmas-light hover:bg-palmas-dark hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-green-900">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-palmas-light hover:bg-palmas-dark hover:text-white transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar