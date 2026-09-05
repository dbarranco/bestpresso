import { getDecaidEndpoints } from './config'
import type { CupWarmerPreheatState, CupWarmerState, DecaidAdvancedSettings, DecaidDevice, DecaidMachineSettings, DecaidProfile, DecaidProfileRecord, DecaidSettings, DecaidWorkflow, DecaidWorkflowPatch, DisplayState, FavoriteAssignments, PaginatedShots, ScalePowerMode, ShotRecord, SkinRecord } from './types'

export class DecaidApiError extends Error {
  status: number
  type?: string

  constructor(message: string, status: number, type?: string) {
    super(message)
    this.name = 'DecaidApiError'
    this.status = status
    this.type = type
  }
}

async function getJson<T>(path: string, timeoutMs = 4500): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${getDecaidEndpoints().apiBase}${path}`, { signal: controller.signal })
    if (!response.ok) throw new Error(`Decaid ${path} returned ${response.status}`)
    return await response.json() as T
  } finally {
    window.clearTimeout(timeout)
  }
}

export const getWorkflow = () => getJson<DecaidWorkflow>('/workflow')
export const getProfiles = () => getJson<DecaidProfileRecord[]>('/profiles')
export const getFavoriteAssignments = () => getJson<FavoriteAssignments>('/store/streamline-app/favorite-profiles')
export const getSharedSetting = <T>(key: string) => getJson<T>(`/store/streamline-app/${encodeURIComponent(key)}`)
export const getDevices = () => getJson<DecaidDevice[]>('/devices')
export const scanForDevices = () => getJson<unknown[]>('/devices/scan', 30000)
export const getDisplayState = () => getJson<DisplayState>('/display')
export const getSettings = () => getJson<DecaidSettings>('/settings')
export const getMachineSettings = () => getJson<DecaidMachineSettings>('/machine/settings')
export const getAdvancedMachineSettings = () => getJson<DecaidAdvancedSettings>('/machine/settings/advanced')
export const getMachineCalibration = () => getJson<DecaidAdvancedSettings>('/machine/calibration')
export const getCupWarmer = () => getJson<CupWarmerState>('/machine/cupWarmer')
export const getCupWarmerPreheat = () => getJson<CupWarmerPreheatState>('/machine/cupWarmer/preheat')
export const getSkins = () => getJson<SkinRecord[]>('/webui/skins')
export const getDefaultSkin = () => getJson<SkinRecord | null>('/webui/skins/default').catch(() => null)

async function sendJson(path: string, body: unknown, method = 'POST') {
  const response = await fetch(`${getDecaidEndpoints().apiBase}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Decaid ${path} returned ${response.status}: ${await response.text()}`)
  return await response.json().catch(() => null) as unknown
}

export async function updateMachineSettings(patch: Partial<DecaidMachineSettings>) {
  await sendJson('/machine/settings', patch)
}

export async function updateAdvancedMachineSettings(patch: Partial<DecaidAdvancedSettings>) {
  await sendJson('/machine/settings/advanced', patch)
}

export async function updateMachineCalibration(flowMultiplier: number) {
  await sendJson('/machine/calibration', { flowMultiplier })
}

export async function updateCupWarmer(patch: Partial<CupWarmerState>) {
  await sendJson('/machine/cupWarmer', patch)
}

export async function updateCupWarmerPreheat(patch: Partial<CupWarmerPreheatState>) {
  await sendJson('/machine/cupWarmer/preheat', patch)
}

export async function updateScaleCalibration(command: 'zero' | 'latch' | 'abort', weightGrams?: number) {
  const body: Record<string, unknown> = { command }
  if (command === 'latch' && weightGrams != null) body.weightGrams = weightGrams
  await sendJson('/machine/scaleCalibration', body)
}

export async function setDefaultSkin(skinId: string) {
  await sendJson('/webui/skins/default', { skinId }, 'PUT')
}

export async function resetMachineSettings() {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/machine/settings/reset`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`Decaid machine settings reset returned ${response.status}`)
}

export async function createProfile(profile: DecaidProfile, parentId?: string, metadata?: Record<string, unknown> | null) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, parentId: parentId ?? null, metadata: metadata ?? null }),
  })
  if (!response.ok) throw new Error(`Decaid profile creation returned ${response.status}: ${await response.text()}`)
  return await response.json() as DecaidProfileRecord
}

export async function connectDevice(deviceId: string) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/devices/connect`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  })
  if (response.ok) return

  const body = await response.json().catch(() => null) as { message?: string; type?: string } | null
  throw new DecaidApiError(body?.message || `Decaid device connection returned ${response.status}`, response.status, body?.type)
}

export async function disconnectDevice(deviceId: string) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/devices/disconnect`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  })
  if (!response.ok) throw new DecaidApiError(`Decaid device disconnect returned ${response.status}`, response.status)
}

export async function tareScale() {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/scale/tare`, { method: 'PUT' })
  if (response.ok) return

  const body = await response.json().catch(() => null) as { message?: string; type?: string } | null
  throw new DecaidApiError(body?.message || `Decaid scale tare returned ${response.status}`, response.status, body?.type)
}

export async function setDisplayBrightness(brightness: number) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/display/brightness`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brightness }),
  })
  if (!response.ok) throw new Error(`Decaid display brightness returned ${response.status}`)
  return await response.json() as DisplayState
}

export async function updateSettings(patch: Partial<DecaidSettings>) {
  await sendJson('/settings', patch)
}

export async function updateSkins() {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/webui/skins/update`, { method: 'POST' })
  if (!response.ok) throw new Error(`Decaid skin update returned ${response.status}: ${await response.text()}`)
  return await response.json() as { message?: string }
}

export async function setScalePowerMode(scalePowerMode: ScalePowerMode) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scalePowerMode }),
  })
  if (!response.ok) throw new Error(`Decaid scale power mode returned ${response.status}`)
}

export async function updateWorkflow(patch: DecaidWorkflowPatch) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/workflow`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!response.ok) throw new Error(`Decaid workflow update returned ${response.status}: ${await response.text()}`)
  return await response.json() as DecaidWorkflow
}

export async function updateProfileMetadata(profileId: string, metadata: Record<string, unknown>) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/profiles/${encodeURIComponent(profileId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata }),
  })
  if (!response.ok) throw new Error(`Decaid profile update returned ${response.status}: ${await response.text()}`)
  return await response.json() as DecaidProfileRecord
}

export async function setSharedSetting(key: string, value: unknown) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/store/streamline-app/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Decaid shared setting returned ${response.status}`)
}

export async function setMachineState(state: 'idle' | 'sleeping' | 'espresso' | 'cleaning' | 'skipStep') {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/machine/state/${state}`, { method: 'PUT' })
  if (!response.ok) throw new Error(`Decaid machine state returned ${response.status}`)
}

export async function setMachineProfile(profile: DecaidProfile) {
  const response = await fetch(`${getDecaidEndpoints().apiBase}/machine/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!response.ok) throw new Error(`Decaid machine profile upload returned ${response.status}: ${await response.text()}`)
}

export async function getLatestShot() {
  const latest = await getJson<ShotRecord | null>('/shots/latest')
  return latest?.id ? getJson<ShotRecord>(`/shots/${encodeURIComponent(latest.id)}`) : null
}

export const getShotHistory = (limit = 30, offset = 0) => getJson<PaginatedShots>(`/shots?limit=${limit}&offset=${offset}&orderBy=timestamp&order=desc`)
export const getShot = (id: string) => getJson<ShotRecord>(`/shots/${encodeURIComponent(id)}`)
