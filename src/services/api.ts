import axios from 'axios'
import { Dispositivo, Alerta, EstadisticasDashboard } from '../types'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8084'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── AUTENTICACIÓN ──────────────────────────────────
export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

// ── DASHBOARD ──────────────────────────────────────
export const getDashboard = async (): Promise<EstadisticasDashboard> => {
  const response = await api.get('/dashboard')
  return response.data
}

// ── DISPOSITIVOS ───────────────────────────────────
export const getDispositivos = async (): Promise<Dispositivo[]> => {
  const response = await api.get('/dispositivos')
  return response.data
}

export const getDispositivo = async (id: string): Promise<Dispositivo> => {
  const response = await api.get(`/dispositivos/${id}`)
  return response.data
}

export const bloquearDispositivo = async (id: string) => {
  const response = await api.post(`/dispositivos/${id}/bloquear`)
  return response.data
}

export const desbloquearDispositivo = async (id: string) => {
  const response = await api.post(`/dispositivos/${id}/desbloquear`)
  return response.data
}

export const borrarDispositivo = async (id: string) => {
  const response = await api.post(`/dispositivos/${id}/borrar`)
  return response.data
}

export const enviarComando = async (id: string, comando: string) => {
  const response = await api.post(`/dispositivos/${id}/comando`, { comando })
  return response.data
}

// ── ALERTAS ────────────────────────────────────────
export const getAlertas = async (): Promise<Alerta[]> => {
  const response = await api.get('/alertas')
  return response.data
}

export const marcarAlertaLeida = async (id: string) => {
  const response = await api.put(`/alertas/${id}/leida`)
  return response.data
}

export default api