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
    <div className="flex min-h-screen bg-palmas-dark">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header titulo={titulo} alertas={alertas} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout