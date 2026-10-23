import React from 'react'
import { Bell, RefreshCw } from 'lucide-react'

interface HeaderProps {
  titulo: string
  alertas?: number
}

const Header: React.FC<HeaderProps> = ({ titulo, alertas = 0 }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-palmas-card border-b border-green-900">
      
      <div>
        <h2 className="text-white font-bold text-xl">{titulo}</h2>
        <p className="text-palmas-light text-xs">
          Grupo Palmas — Sistema MDM Corporativo
        </p>
      </div>

      <div className="flex items-center gap-4">
        
        {/* Botón refrescar */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg text-palmas-light hover:bg-palmas-dark hover:text-white transition-all"
          title="Refrescar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Alertas */}
        <button className="relative p-2 rounded-lg text-palmas-light hover:bg-palmas-dark hover:text-white transition-all">
          <Bell className="w-5 h-5" />
          {alertas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertas > 9 ? '9+' : alertas}
            </span>
          )}
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-palmas-dark">
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