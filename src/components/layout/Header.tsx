import React from 'react'
import { Bell, RefreshCw, Sun, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

interface HeaderProps {
  titulo: string
  subtitulo?: string
  alertas?: number
  onRefresh?: () => void
}

const Header: React.FC<HeaderProps> = ({ titulo, subtitulo, alertas = 0, onRefresh }) => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleRefresh = () => {
    if (onRefresh) onRefresh()
    else navigate(0)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-palmas-card border-b border-palmas-border">
      <div>
        <h2 className="text-white font-bold text-xl">{titulo}</h2>
        <p className="text-palmas-light text-xs">
          {subtitulo || 'Grupo Palmas — Sistema MDM Corporativo'}
        </p>
      </div>

      <div className="flex items-center gap-3">

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-palmas-light hover:bg-palmas-border hover:text-white transition-all"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-palmas-light hover:bg-palmas-border hover:text-white transition-all"
          title="Refrescar datos"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/alertas')}
          className="relative p-2 rounded-lg text-palmas-light hover:bg-palmas-border hover:text-white transition-all"
          title="Ver alertas"
        >
          <Bell className="w-5 h-5" />
          {alertas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {alertas > 9 ? '9+' : alertas}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-palmas-border">
          <div className="w-7 h-7 rounded-full bg-palmas-green flex items-center justify-center">
            <span className="text-white text-xs font-bold">TI</span>
          </div>
          <span className="text-white text-sm font-medium">Administrador</span>
        </div>
      </div>
    </header>
  )
}

export default Header
