import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Dispositivos from './pages/Dispositivos'
import Alertas from './pages/Alertas'
import Colaboradores from './pages/Colaboradores'
import Configuracion from './pages/Configuracion'
import DetalleDispositivo from './pages/DetalleDispositivo'
import Enrolamiento from './pages/Enrolamiento'
import Perfiles from './pages/Perfiles'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/mdm">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dispositivos" element={<PrivateRoute><Dispositivos /></PrivateRoute>} />
        <Route path="/dispositivos/:id" element={<PrivateRoute><DetalleDispositivo /></PrivateRoute>} />
        <Route path="/alertas" element={<PrivateRoute><Alertas /></PrivateRoute>} />
        <Route path="/colaboradores" element={<PrivateRoute><Colaboradores /></PrivateRoute>} />
        <Route path="/enrolamiento" element={<PrivateRoute><Enrolamiento /></PrivateRoute>} />
        <Route path="/perfiles" element={<PrivateRoute><Perfiles /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Configuracion /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
