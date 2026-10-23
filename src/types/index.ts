export interface Dispositivo {
  id: string
  imei: string
  serial: string
  modelo: string
  fabricante: string
  android: string
  sede: string
  estado: 'activo' | 'inactivo' | 'bloqueado'
  deviceOwner: boolean
  ultimaConexion: string
  colaborador?: Colaborador
  politicas: Politicas
}

export interface Colaborador {
  nombre: string
  dni: string
  area: string
  puesto: string
}

export interface Politicas {
  instalacionBloqueada: boolean
  factoryResetBloqueado: boolean
  usbDebuggingBloqueado: boolean
  pinRequerido: boolean
}

export interface Alerta {
  id: string
  dispositivoId: string
  tipo: 'instalacion' | 'root' | 'depuracion' | 'acceso_admin'
  mensaje: string
  fecha: string
  leida: boolean
}

export interface EstadisticasDashboard {
  totalDispositivos: number
  dispositivosActivos: number
  dispositivosInactivos: number
  dispositivosBloqueados: number
  alertasPendientes: number
  dispositivosPorSede: {
    sede: string
    cantidad: number
  }[]
}