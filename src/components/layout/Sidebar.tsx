import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Smartphone,
  Bell,
  Users,
  Settings,
  Shield,
  LogOut,
  QrCode,
  Package
} from 'lucide-react'

const navItems = [
  { path: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dispositivos',  icon: Smartphone,      label: 'Dispositivos' },
  { path: '/enrolamiento',  icon: QrCode,          label: 'Enrolamiento' },
  { path: '/perfiles',      icon: Package,         label: 'Perfiles' },
  { path: '/alertas',       icon: Bell,            label: 'Alertas' },
  { path: '/colaboradores', icon: Users,           label: 'Colaboradores' },
  { path: '/configuracion', icon: Settings,        label: 'Configuración' },
]

const Sidebar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/mdm/login'
  }

  return (
    <div className="flex flex-col w-64 min-h-screen bg-palmas-card border-r border-palmas-border">

      <div className="flex flex-col items-center py-8 px-4 border-b border-palmas-border">
        <div className="w-14 h-14 rounded-xl bg-palmas-green flex items-center justify-center mb-3 shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-white font-bold text-base tracking-wide">Grupo Palmas</h1>
        <p className="text-palmas-light text-xs">MDM Console</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-palmas-green text-white font-semibold'
                  : 'text-palmas-light hover:bg-palmas-border hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-5 border-t border-palmas-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-palmas-light hover:bg-palmas-border hover:text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
