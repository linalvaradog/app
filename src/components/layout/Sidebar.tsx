import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Smartphone, Bell, Users, Settings, LogOut, QrCode, Package } from 'lucide-react'
import { PALMAS_LOGO } from '../../assets/logo'

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
    <div className="flex flex-col w-64 h-full bg-palmas-card border-r border-palmas-border flex-shrink-0">

      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-palmas-border">
        <img
          src={PALMAS_LOGO}
          alt="Grupo Palmas"
          className="w-28 h-auto mb-2 object-contain"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }}
        />
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
