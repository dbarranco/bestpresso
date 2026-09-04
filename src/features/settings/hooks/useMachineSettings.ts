import { useCallback, useEffect, useState } from 'react'
import { getAdvancedMachineSettings, getCupWarmer, getCupWarmerPreheat, getDisplayState, getMachineCalibration, getMachineSettings, getSettings, resetMachineSettings as resetSettingsApi, setDisplayBrightness, updateAdvancedMachineSettings, updateCupWarmer as updateCupWarmerApi, updateCupWarmerPreheat as updateCupWarmerPreheatApi, updateMachineCalibration, updateMachineSettings as updateMachineSettingsApi, updateScaleCalibration, updateSettings as updateSettingsApi, updateWorkflow } from '../../../api/decaid/client'
import type { CupWarmerPreheatState, CupWarmerState, DecaidAdvancedSettings, DecaidMachineSettings, DecaidSettings } from '../../../api/decaid/types'
import type { EditableMachineSetting } from '../../../domain/brewing'

type Feedback = (status: 'saving' | 'saved' | 'error', message: string) => void

const machineSettingsPatch = (setting: EditableMachineSetting, value: number): Partial<DecaidMachineSettings> => {
  switch (setting) {
    case 'flushTemp': return { flushTemp: value }
    case 'flushTimeout': return { flushTimeout: value }
    case 'flushFlow': return { flushFlow: value }
    case 'fan': return { fan: value }
    case 'steamPurgeMode': return { steamPurgeMode: value }
    default: return {}
  }
}

const advancedSettingsPatch = (setting: EditableMachineSetting, value: number): Partial<DecaidAdvancedSettings> | null => {
  switch (setting) {
    case 'heaterPh1Flow': return { heaterPh1Flow: value }
    case 'heaterPh2Flow': return { heaterPh2Flow: value }
    case 'heaterIdleTemp': return { heaterIdleTemp: value }
    case 'heaterPh2Timeout': return { heaterPh2Timeout: value }
    case 'heaterVoltage': return { heaterVoltage: value }
    default: return null
  }
}

async function tryGet<T>(fetchFn: () => Promise<T>): Promise<T | null> {
  try {
    return await fetchFn()
  } catch (error) {
    console.error('Failed to load optional setting:', error)
    return null
  }
}

export function useMachineSettings(onFeedback: Feedback) {
  const [machineSettings, setMachineSettings] = useState<DecaidMachineSettings | null>(null)
  const [advancedSettings, setAdvancedSettings] = useState<DecaidAdvancedSettings | null>(null)
  const [flowMultiplier, setFlowMultiplier] = useState<number | null>(null)
  const [cupWarmer, setCupWarmer] = useState<CupWarmerState | null>(null)
  const [cupWarmerPreheat, setCupWarmerPreheat] = useState<CupWarmerPreheatState | null>(null)
  const [displayBrightness, setDisplayBrightnessState] = useState<number | null>(null)
  const [storeSettings, setStoreSettings] = useState<DecaidSettings | null>(null)

  const refresh = useCallback(async () => {
    const [settings, advanced, calibration, warmer, warmerPreheat, display, store] = await Promise.all([
      getMachineSettings(),
      getAdvancedMachineSettings(),
      getMachineCalibration(),
      tryGet(getCupWarmer),
      tryGet(getCupWarmerPreheat),
      tryGet(async () => (await getDisplayState()).brightness ?? null),
      tryGet(getSettings),
    ])
    setMachineSettings(settings)
    setAdvancedSettings(advanced)
    setFlowMultiplier(typeof calibration.flowMultiplier === 'number' ? calibration.flowMultiplier : null)
    setCupWarmer(warmer)
    setCupWarmerPreheat(warmerPreheat)
    setDisplayBrightnessState(display)
    setStoreSettings(store)
  }, [])

  // eslint-disable-next-line react/set-state-in-effect -- initial fetch on mount; state is set after async resolution
  useEffect(() => {
    refresh().catch((error) => console.error('Failed to fetch machine settings:', error))
  }, [refresh])

  const updateMachineSetting = useCallback(async (setting: EditableMachineSetting, value: number) => {
    try {
      onFeedback('saving', 'Updating machine setting...')

      if (setting === 'hotWaterVolume') await updateWorkflow({ hotWaterData: { volume: value } })
      else if (setting === 'hotWaterTemperature') await updateWorkflow({ hotWaterData: { targetTemperature: value } })
      else if (setting === 'steamTemperature') await updateWorkflow({ steamSettings: { targetTemperature: value } })
      else if (setting === 'steamDuration') await updateWorkflow({ steamSettings: { duration: value } })
      else if (setting === 'steamFlow') await updateWorkflow({ steamSettings: { flow: value } })
      else if (setting === 'flowMultiplier') await updateMachineCalibration(value)
      else if (setting === 'cupWarmerTemperature') await updateCupWarmerApi({ temperature: value })
      else if (setting === 'cupWarmerLeadMinutes') await updateCupWarmerPreheatApi({ leadMinutes: value })
      else {
        const advanced = advancedSettingsPatch(setting, value)
        if (advanced) await updateAdvancedMachineSettings(advanced)
        else await updateMachineSettingsApi(machineSettingsPatch(setting, value))
      }

      if (setting === 'heaterVoltage' || setting === 'heaterPh1Flow' || setting === 'heaterPh2Flow' || setting === 'heaterIdleTemp' || setting === 'heaterPh2Timeout') {
        setAdvancedSettings((prev) => ({ ...prev, [setting]: value }))
      }
      if (setting === 'flowMultiplier') setFlowMultiplier(value)
      if (setting === 'cupWarmerTemperature') setCupWarmer((prev) => ({ ...prev, temperature: value }))
      if (setting === 'cupWarmerLeadMinutes') setCupWarmerPreheat((prev) => ({ ...prev, leadMinutes: value }))
      const refreshKeys = ['flushTemp', 'flushTimeout', 'flushFlow', 'fan', 'steamPurgeMode']
      if (refreshKeys.includes(setting)) await refresh()

      onFeedback('saved', 'Machine setting updated')
    } catch (error) {
      console.error('Failed to update machine setting:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update machine setting')
    }
  }, [onFeedback, refresh])

  const updateUsbCharger = useCallback(async (enabled: boolean) => {
    try {
      onFeedback('saving', enabled ? 'Enabling USB charger...' : 'Disabling USB charger...')
      await updateMachineSettingsApi({ usb: enabled })
      setMachineSettings((prev) => ({ ...prev, usb: enabled }))
      onFeedback('saved', 'USB charger updated')
    } catch (error) {
      console.error('Failed to update USB charger:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update USB charger')
    }
  }, [onFeedback])

  const updateCupWarmer = useCallback(async (patch: Partial<CupWarmerState>) => {
    try {
      onFeedback('saving', 'Updating cup warmer...')
      await updateCupWarmerApi(patch)
      setCupWarmer((prev) => ({ ...prev, ...patch }))
      onFeedback('saved', 'Cup warmer updated')
    } catch (error) {
      console.error('Failed to update cup warmer:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update cup warmer')
    }
  }, [onFeedback])

  const updateCupWarmerPreheat = useCallback(async (patch: Partial<CupWarmerPreheatState>) => {
    try {
      onFeedback('saving', 'Updating preheat...')
      await updateCupWarmerPreheatApi(patch)
      setCupWarmerPreheat((prev) => ({ ...prev, ...patch }))
      onFeedback('saved', 'Preheat updated')
    } catch (error) {
      console.error('Failed to update preheat:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update preheat')
    }
  }, [onFeedback])

  const updateAdvancedSetting = useCallback(async (patch: Partial<DecaidAdvancedSettings>) => {
    try {
      onFeedback('saving', 'Updating advanced setting...')
      await updateAdvancedMachineSettings(patch)
      setAdvancedSettings((prev) => ({ ...prev, ...patch }))
      onFeedback('saved', 'Advanced setting updated')
    } catch (error) {
      console.error('Failed to update advanced setting:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update advanced setting')
    }
  }, [onFeedback])

  const setBrightness = useCallback(async (brightness: number) => {
    try {
      onFeedback('saving', 'Setting brightness...')
      await setDisplayBrightness(brightness)
      setDisplayBrightnessState(brightness)
      onFeedback('saved', 'Brightness updated')
    } catch (error) {
      console.error('Failed to set brightness:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to set brightness')
    }
  }, [onFeedback])

  const updateStoreSetting = useCallback(async (patch: Partial<DecaidSettings>) => {
    try {
      onFeedback('saving', 'Updating option...')
      await updateSettingsApi(patch)
      setStoreSettings((prev) => ({ ...prev, ...patch }))
      onFeedback('saved', 'Option updated')
    } catch (error) {
      console.error('Failed to update option:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update option')
    }
  }, [onFeedback])

  const onScaleCalibration = useCallback(async (command: 'zero' | 'latch' | 'abort', weightGrams?: number) => {
    try {
      onFeedback('saving', 'Calibrating scale...')
      await updateScaleCalibration(command, weightGrams)
      onFeedback('saved', 'Scale calibration started')
    } catch (error) {
      console.error('Failed to calibrate scale:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to calibrate scale')
    }
  }, [onFeedback])

  const resetSettings = useCallback(async () => {
    try {
      onFeedback('saving', 'Resetting machine settings...')
      await resetSettingsApi()
      await refresh()
      onFeedback('saved', 'Machine settings reset to defaults')
    } catch (error) {
      console.error('Failed to reset machine settings:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to reset machine settings')
    }
  }, [onFeedback, refresh])

  return { updateMachineSetting, updateUsbCharger, updateCupWarmer, updateCupWarmerPreheat, updateAdvancedSetting, setBrightness, updateStoreSetting, onScaleCalibration, resetSettings, machineSettings, advancedSettings, flowMultiplier, cupWarmer, cupWarmerPreheat, displayBrightness, storeSettings }
}