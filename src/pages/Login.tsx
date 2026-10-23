import React, { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || '/api'

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
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      })
      localStorage.setItem('token', response.data.token)
      window.location.href = '/mdm/'
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/mdm/palmas-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1a2e1a',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        <div
          style={{
            backgroundColor: 'rgba(10, 20, 10, 0.88)',
            border: '1px solid rgba(100,200,100,0.25)',
            borderRadius: '12px',
            padding: '40px 36px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#2e7d32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ color: '#a5d6a7', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
              TI TULUMAYO · MDM PLATFORM
            </div>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
              GRUPO PALMAS
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#a5d6a7', fontSize: 12, display: 'block', marginBottom: 6 }}>
                USUARIO
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(100,200,100,0.3)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#a5d6a7', fontSize: 12, display: 'block', marginBottom: 6 }}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(100,200,100,0.3)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#ef9a9a', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#388e3c99' : '#2e7d32',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 2,
                border: 'none',
                borderRadius: 6,
                padding: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
          Grupo Palmas MDM v1.0 — TI Corporativo
        </div>
      </div>
    </div>
  )
}

export default Login
