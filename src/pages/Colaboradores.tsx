import React, { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import axios from 'axios'
import { User, Search, Plus, X, Loader2, RefreshCw, UserPlus, Building2 } from 'lucide-react'

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000'
const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

interface Colaborador {
  id: string
  dni: string
  nombre: string
  puesto: string
  sede: string
  email: string
  fuente: 'invgate' | 'local'
}

const FORM_VACIO = { dni: '', nombre: '', puesto: '', sede: '' }

const Colaboradores: React.FC = () => {
  const [invgate, setInvgate] = useState<Colaborador[]>([])
  const [locales, setLocales] = useState<Colaborador[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorInvgate, setErrorInvgate] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [tab, setTab] = useState<'todos' | 'invgate' | 'locales'>('todos')

  const cargar = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/colaboradores`, token())
      setInvgate(data.invgate || [])
      setLocales(data.locales || [])
      setErrorInvgate((data.invgate || []).length === 0)
    } catch {
      setErrorInvgate(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const todos: Colaborador[] = [
    ...(tab === 'locales' ? [] : invgate),
    ...(tab === 'invgate' ? [] : locales),
  ]

  const filtrados = todos.filter(c =>
    [c.nombre, c.dni, c.puesto, c.sede, c.email].some(v =>
      v?.toLowerCase().includes(filtro.toLowerCase())
    )
  )

  const guardar = async () => {
    if (!form.dni || !form.nombre) return
    setGuardando(true)
    try {
      await axios.post(`${API}/colaboradores`, form, token())
      setModal(false)
      setForm(FORM_VACIO)
      cargar()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este colaborador?')) return
    const numId = id.replace('local-', '')
    try {
      await axios.delete(`${API}/colaboradores/${numId}`, token())
      cargar()
    } catch {}
  }

  return (
    <Layout titulo="Colaboradores">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-palmas-light" />
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, DNI, puesto..."
            className="w-full bg-palmas-card border border-palmas-border rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-palmas-green"
          />
        </div>
        <button onClick={cargar} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-palmas-card border border-palmas-border text-palmas-light hover:text-white transition-all text-sm">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
        <button onClick={() => { setForm(FORM_VACIO); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-palmas-green text-white text-sm font-medium hover:bg-green-600 transition-all">
          <UserPlus className="w-4 h-4" /> Agregar colaborador
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-palmas-card rounded-lg p-1 w-fit border border-palmas-border">
        {(['todos', 'invgate', 'locales'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-palmas-green text-white' : 'text-palmas-light hover:text-white'}`}>
            {t === 'todos' ? `Todos (${invgate.length + locales.length})` : t === 'invgate' ? `InvGate (${invgate.length})` : `Manuales (${locales.length})`}
          </button>
        ))}
      </div>

      {/* Warning InvGate */}
      {errorInvgate && !loading && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm">
          No se pudo conectar a InvGate. Se muestran solo los colaboradores registrados manualmente.
        </div>
      )}

      {/* Tabla */}
      <div className="bg-palmas-card rounded-xl border border-palmas-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-palmas-light">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando colaboradores...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-palmas-light">
            <User className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron colaboradores</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-palmas-border text-palmas-light text-xs uppercase">
                <th className="px-4 py-3 text-left">Colaborador</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">DNI</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Puesto</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Sede</th>
                <th className="px-4 py-3 text-left">Fuente</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} className="border-b border-palmas-border/50 hover:bg-palmas-border/20 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-palmas-green/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-palmas-green" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{c.nombre}</p>
                        {c.email && <p className="text-palmas-light text-xs">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-palmas-light hidden md:table-cell">{c.dni || '—'}</td>
                  <td className="px-4 py-3 text-palmas-light hidden lg:table-cell">{c.puesto || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {c.sede ? (
                      <span className="flex items-center gap-1 text-palmas-light">
                        <Building2 className="w-3 h-3" />{c.sede}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.fuente === 'invgate' ? 'bg-blue-900/40 text-blue-300' : 'bg-palmas-green/20 text-palmas-green'}`}>
                      {c.fuente === 'invgate' ? 'InvGate' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.fuente === 'local' && (
                      <button onClick={() => eliminar(c.id)} className="text-palmas-light hover:text-red-400 transition-all p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal agregar */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-palmas-card border border-palmas-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-palmas-border">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-palmas-green" /> Agregar colaborador manual
              </h3>
              <button onClick={() => setModal(false)} className="text-palmas-light hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-palmas-light text-xs">Para operadores sin cuenta de correo corporativo o que no estén en InvGate/Azure AD.</p>
              {[
                { key: 'dni', label: 'DNI *', placeholder: 'Número de documento' },
                { key: 'nombre', label: 'Nombre completo *', placeholder: 'Apellidos y nombres' },
                { key: 'puesto', label: 'Puesto / Cargo', placeholder: 'Operador, Técnico...' },
                { key: 'sede', label: 'Sede / Área', placeholder: 'Tulumayo, Shanusi...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-palmas-light text-xs mb-1">{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-palmas-dark border border-palmas-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-palmas-green"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-5 border-t border-palmas-border">
              <button onClick={() => setModal(false)} className="flex-1 py-2 rounded-lg border border-palmas-border text-palmas-light hover:text-white text-sm transition-all">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !form.dni || !form.nombre}
                className="flex-1 py-2 rounded-lg bg-palmas-green text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Colaboradores
