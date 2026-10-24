import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  titulo: string
  alertas?: number
}

const Layout: React.FC<LayoutProps> = ({ children, titulo, alertas }) => {
  return (
    <div className="flex h-screen bg-palmas-dark overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header titulo={titulo} alertas={alertas} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout