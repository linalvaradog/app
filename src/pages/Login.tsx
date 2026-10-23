import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import axios from 'axios'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('http://localhost:8000/auth/login', {
        username,
        password
      })
      localStorage.setItem('token', response.data.token)
      window.location.href = '/'
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-palmas-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-palmas-green rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">Grupo Palmas MDM</h1>
          <p className="text-palmas-light text-sm mt-1">Consola de Administración</p>
        </div>

        <div className="bg-palmas-card rounded-xl p-8 border border-green-900">
          <h2 className="text-white font-bold text-lg mb-6">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-palmas-light text-sm mb-2 block">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white placeholder-green-900 focus:outline-none focus:border-palmas-green"
                required
              />
            </div>

            <div>
              <label className="text-palmas-light text-sm mb-2 block">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-palmas-dark border border-green-900 rounded-lg px-4 py-3 text-white placeholder-green-900 focus:outline-none focus:border-palmas-green"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-palmas-green hover:bg-palmas-accent text-white font-bold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-green-900 text-xs mt-6">
          Grupo Palmas MDM v1.0 — TI Corporativo
        </p>
      </div>
    </div>
  )
}

export default Login