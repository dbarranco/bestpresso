import { useCallback, useEffect, useRef, useState } from 'react'
import { connectDevice, disconnectDevice, getDevices, scanForDevices } from '../../../api/decaid/client'
import type { DecaidDevice } from '../../../api/decaid/types'

type Feedback = (status: 'saving' | 'saved' | 'error', message: string) => void

export function useBluetoothDevices(onFeedback: Feedback) {
  const [devices, setDevices] = useState<DecaidDevice[]>([])
  const [scanning, setScanning] = useState(false)
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null)
  const mounted = useRef(true)

  const refresh = useCallback(() => {
    return getDevices().then(setDevices).catch((error) => console.error('Failed to fetch devices:', error))
  }, [])

  useEffect(() => {
    refresh()
    return () => { mounted.current = false }
  }, [refresh])

  const scan = useCallback(async () => {
    setScanning(true)
    try {
      await scanForDevices()
      await refresh()
      onFeedback('saved', 'Scan complete')
    } catch (error) {
      console.error('Failed to scan for devices:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to scan for devices')
    } finally {
      if (mounted.current) setScanning(false)
    }
  }, [onFeedback, refresh])

  const connect = useCallback(async (deviceId: string) => {
    setPendingDeviceId(deviceId)
    try {
      await connectDevice(deviceId)
      await refresh()
      onFeedback('saved', 'Device connected')
    } catch (error) {
      console.error('Failed to connect device:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to connect device')
    } finally {
      if (mounted.current) setPendingDeviceId(null)
    }
  }, [onFeedback, refresh])

  const disconnect = useCallback(async (deviceId: string) => {
    setPendingDeviceId(deviceId)
    try {
      await disconnectDevice(deviceId)
      await refresh()
      onFeedback('saved', 'Device disconnected')
    } catch (error) {
      console.error('Failed to disconnect device:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to disconnect device')
    } finally {
      if (mounted.current) setPendingDeviceId(null)
    }
  }, [onFeedback, refresh])

  return { devices, scanning, pendingDeviceId, refresh, scan, connect, disconnect }
}