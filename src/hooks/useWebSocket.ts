import { useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws'

export const useWebSocket = (onMessage: (evento: string, datos: any) => void) => {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        console.log('✅ WebSocket conectado al servidor MDM')
      }

      ws.current.onmessage = (event) => {
        try {
          const { evento, datos } = JSON.parse(event.data)
          onMessage(evento, datos)
        } catch (e) {
          console.warn('Error parseando mensaje WebSocket', e)
        }
      }

      ws.current.onclose = () => {
        console.log('🔌 WebSocket desconectado — reconectando en 3s...')
        reconnectTimeout.current = setTimeout(connect, 3000)
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }

    } catch (e) {
      console.warn('Error conectando WebSocket:', e)
      reconnectTimeout.current = setTimeout(connect, 3000)
    }
  }, [onMessage])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      ws.current?.close()
    }
  }, [connect])
}