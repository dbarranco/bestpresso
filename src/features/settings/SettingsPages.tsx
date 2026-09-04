// eslint-disable-next-line react/only-export-components -- page registry intentionally co-located with components
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CupWarmerPreheatState, CupWarmerState, DecaidAdvancedSettings, DecaidDevice, DecaidMachineSettings, DecaidSettings, SkinRecord } from '../../api/decaid/types'
import { Metric } from '../../components/Metric/Metric'
import type { MetricEdit } from '../../components/Metric/Metric'
import type { BrewProfile, BrewingScreenModel, EditableMachineSetting, EditableProfileSetting, MachineUtility, ScaleConnection, SettingFeedback } from '../../domain/brewing'
import type { SettingsPageKey } from '../../domain/settingsTree'
import { VALUE_ADJUSTMENTS } from '../../domain/valueAdjustments'
import type { ValueAdjustmentKey } from '../../domain/valueAdjustments'
import { MachineUtilityCard } from '../machine/MachineUtilityCard'
import { ButtonRow, ComingSoon, PageFrame, SelectRow, StatusRow, ToggleRow } from './SettingControls'

export interface SettingsPageProps {
  model: BrewingScreenModel
  feedback: SettingFeedback | null
  scale?: ScaleConnection
  scaleTarePending?: boolean
  settingsDisabled?: boolean
  onSearchScale?: () => void
  onTareScale?: () => void
  updateProfileSetting: (setting: EditableProfileSetting, value: number) => void
  updateMachineSetting: (setting: EditableMachineSetting, value: number) => void
  updateUsbCharger: (enabled: boolean) => void
  resetSettings: () => void
  machineSettings: DecaidMachineSettings | null
  advancedSettings: DecaidAdvancedSettings | null
  flowMultiplier: number | null
  devices: DecaidDevice[]
  scanning: boolean
  pendingDeviceId: string | null
  onScanDevices: () => void
  onConnectDevice: (deviceId: string) => void
  onDisconnectDevice: (deviceId: string) => void
  cupWarmer: CupWarmerState | null
  cupWarmerPreheat: CupWarmerPreheatState | null
  displayBrightness: number | null
  storeSettings: DecaidSettings | null
  updateCupWarmer: (patch: Partial<CupWarmerState>) => void
  updateCupWarmerPreheat: (patch: Partial<CupWarmerPreheatState>) => void
  updateAdvancedSetting: (patch: Partial<DecaidAdvancedSettings>) => void
  setBrightness: (brightness: number) => void
  updateStoreSetting: (patch: Partial<DecaidSettings>) => void
  onScaleCalibration: (command: 'zero' | 'latch' | 'abort', weightGrams?: number) => void
  skins: SkinRecord[]
  defaultSkinId: string | null
  onSelectSkin: (skinId: string) => void
}

function metricEdit(setting: ValueAdjustmentKey, value: string | number | undefined, disabled: boolean | undefined, onSave: (value: number) => void): MetricEdit | undefined {
  if (!Number.isFinite(Number(value))) return undefined
  const definition = VALUE_ADJUSTMENTS[setting]
  return {
    title: definition.title,
    min: definition.min,
    max: definition.max,
    step: definition.step,
    mode: definition.mode,
    initialValue: Number(value),
    suggestionKey: setting,
    presets: definition.suggestions,
    disabled,
    onSave,
  }
}

function MetricRows({ utility, onUpdateSetting, disabled }: { utility?: MachineUtility; onUpdateSetting?: (setting: EditableMachineSetting, value: number) => void; disabled?: boolean }) {
  if (!utility) return null
  return (
    <>
      {utility.metrics.map((metric) => {
        let setting: EditableMachineSetting | undefined
        if (utility.id === 'water' && metric.label === 'Volume') setting = 'hotWaterVolume'
        if (utility.id === 'water' && metric.label === 'Temperature') setting = 'hotWaterTemperature'
        if (utility.id === 'steam' && metric.label.toLowerCase() === 'target') setting = 'steamTemperature'
        if (utility.id === 'steam' && metric.label === 'Duration') setting = 'steamDuration'
        if (utility.id === 'steam' && metric.label === 'Flow') setting = 'steamFlow'
        if (!setting) return <div key={metric.label} className="settings-metric"><Metric metric={metric} /></div>
        return (
          <div key={metric.label} className="settings-metric">
            <Metric
              metric={metric}
              edit={metricEdit(setting, metric.value, disabled, (value) => onUpdateSetting?.(setting!, value))}
            />
          </div>
        )
      })}
    </>
  )
}

function ProfileMetrics({ profile, onUpdateSetting, disabled }: { profile: BrewProfile; onUpdateSetting?: (setting: EditableProfileSetting, value: number) => void; disabled?: boolean }) {
  const rows: { setting: EditableProfileSetting; label: string; value: string; unit?: string }[] = []
  if (profile.temperature) rows.push({ setting: 'temperature', label: 'Brew Temperature', value: profile.temperature, unit: '°C' })
  if (profile.grindSetting) rows.push({ setting: 'grindSetting', label: 'Grind Setting', value: profile.grindSetting })
  if (profile.dose) rows.push({ setting: 'dose', label: 'Dose', value: profile.dose, unit: 'g' })
  if (profile.targetYield) rows.push({ setting: 'targetYield', label: 'Target Yield', value: profile.targetYield, unit: 'g' })

  return (
    <>
      {rows.map((row) => (
        <div key={row.setting} className="settings-metric">
          <Metric
            metric={{ label: row.label, value: row.value, unit: row.unit }}
            edit={metricEdit(row.setting, row.value, disabled, (value) => onUpdateSetting?.(row.setting, value))}
          />
        </div>
      ))}
    </>
  )
}

function DeviceRow({ device, busy, onConnect, onDisconnect }: { device: DecaidDevice; busy: boolean; onConnect: () => void; onDisconnect: () => void }) {
  const connected = device.state === 'connected'
  return (
    <div className="device-row">
      <div>
        <p className="device-row__name">{device.name || device.id || 'Unknown device'}</p>
        <p className="settings-row__description">
          {connected ? 'Connected' : device.available ? 'Available' : 'Remembered'}
          {device.available ? ' · tap to connect' : ''}
        </p>
      </div>
      <button
        className="settings-section__button"
        type="button"
        disabled={busy}
        onClick={() => (connected ? onDisconnect() : onConnect())}
      >
        {busy ? '…' : connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

const getMachineStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ready: '✓ Ready',
    heating: 'Heating',
    notHeating: 'Off',
    thirsty: 'Refill Water',
    sleeping: 'Sleeping',
    disconnected: 'Disconnected',
  }
  return labels[status] || status
}

function MachineStatusPage({ model }: SettingsPageProps) {
  return (
    <PageFrame title="Machine Status">
      <div className="settings-page__grid">
        <StatusRow label="Status" value={getMachineStatusLabel(model.readiness)} />
        {model.activeProfileId && (
          <>
            <StatusRow label="Active Profile" value={model.activeProfileId} />
            {model.utilities.find((u) => u.id === 'steam')?.metrics.slice(0, 1).map((m) => (
              <StatusRow key={m.label} label={m.label} value={`${m.value}${m.unit ?? ''}`} />
            ))}
          </>
        )}
      </div>
    </PageFrame>
  )
}

function SteamPage(props: SettingsPageProps) {
  return (
    <PageFrame title="Steam">
      <div className="settings-section__content">
        <div className="settings-section__subsection">
          <h3 className="settings-section__subtitle">Steam Settings</h3>
          <MetricRows utility={props.model.utilities.find((u) => u.id === 'steam')} onUpdateSetting={props.updateMachineSetting} disabled={props.settingsDisabled} />
        </div>
      </div>
    </PageFrame>
  )
}

function HotWaterPage(props: SettingsPageProps) {
  return (
    <PageFrame title="Hot Water">
      <div className="settings-section__content">
        <div className="settings-section__subsection">
          <h3 className="settings-section__subtitle">Hot Water Settings</h3>
          <MetricRows utility={props.model.utilities.find((u) => u.id === 'water')} onUpdateSetting={props.updateMachineSetting} disabled={props.settingsDisabled} />
        </div>
      </div>
    </PageFrame>
  )
}

function WaterTankPage(props: SettingsPageProps) {
  const tank = props.model.utilities.find((u) => u.id === 'tank')
  if (!tank) return <ComingSoon title="Water Tank" />
  return (
    <PageFrame title="Water Tank">
      <MachineUtilityCard
        utility={tank}
        settingsDisabled={props.settingsDisabled}
        onUpdateSetting={props.updateMachineSetting}
      />
    </PageFrame>
  )
}

function FlushPage({ machineSettings, updateMachineSetting, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="Flush">
      <div className="settings-section__content">
        <div className="settings-section__subsection">
          <h3 className="settings-section__subtitle">Flush Settings</h3>
          {machineSettings?.flushTemp !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Temperature', value: String(machineSettings.flushTemp), unit: '°C' }}
                edit={metricEdit('flushTemp', machineSettings.flushTemp, settingsDisabled, (value) => updateMachineSetting('flushTemp', value))}
              />
            </div>
          )}
          {machineSettings?.flushTimeout !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Timeout', value: String(machineSettings.flushTimeout), unit: 's' }}
                edit={metricEdit('flushTimeout', machineSettings.flushTimeout, settingsDisabled, (value) => updateMachineSetting('flushTimeout', value))}
              />
            </div>
          )}
          {machineSettings?.flushFlow !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Flow', value: String(machineSettings.flushFlow), unit: 'ml/s' }}
                edit={metricEdit('flushFlow', machineSettings.flushFlow, settingsDisabled, (value) => updateMachineSetting('flushFlow', value))}
              />
            </div>
          )}
          {!machineSettings?.flushTemp && !machineSettings?.flushTimeout && !machineSettings?.flushFlow && (
            <p className="settings-row__description">Flush settings unavailable.</p>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

function BrewProfilePage(props: SettingsPageProps) {
  const profile = props.model.profiles.find((p) => p.id === props.model.activeProfileId) || props.model.profiles[0]
  if (!profile) return <ComingSoon title="Brew Profile" />
  return (
    <PageFrame title="Brew Profile">
      <div className="settings-section__content">
        <div className="settings-section__subsection">
          <h3 className="settings-section__subtitle">{profile.name}</h3>
          <ProfileMetrics profile={profile} onUpdateSetting={props.updateProfileSetting} disabled={props.settingsDisabled} />
        </div>
      </div>
    </PageFrame>
  )
}

function BluetoothMachinePage({ devices, scanning, pendingDeviceId, onScanDevices, onConnectDevice, onDisconnectDevice }: SettingsPageProps) {
  const machines = devices.filter((d) => !d.type || d.type === 'machine')
  return (
    <PageFrame title="Bluetooth Machine">
      <ButtonRow label="Bluetooth Devices" description="Scan for nearby Decent machines." disabled={scanning} onAction={onScanDevices}>
        {scanning ? 'Scanning…' : 'Scan for devices'}
      </ButtonRow>
      {machines.length === 0 && !scanning && (
        <p className="settings-row__description">No machines found. Tap Scan for devices.</p>
      )}
      {machines.map((device) => (
        <DeviceRow
          key={device.id ?? device.name}
          device={device}
          busy={pendingDeviceId === device.id}
          onConnect={() => device.id && onConnectDevice(device.id)}
          onDisconnect={() => device.id && onDisconnectDevice(device.id)}
        />
      ))}
    </PageFrame>
  )
}

function BluetoothScalePage({ devices, scanning, pendingDeviceId, onScanDevices, onConnectDevice, onDisconnectDevice }: SettingsPageProps) {
  const scales = devices.filter((device) => device.type === 'scale')
  return (
    <PageFrame title="Bluetooth Scale">
      <ButtonRow label="Bluetooth Scales" description="Scan for nearby Deacent scales." disabled={scanning} onAction={onScanDevices}>
        {scanning ? 'Scanning…' : 'Scan for devices'}
      </ButtonRow>
      {scales.length === 0 && !scanning && (
        <p className="settings-row__description">No scales found. Tap Scan for devices.</p>
      )}
      {scales.map((device) => (
        <DeviceRow
          key={device.id ?? device.name}
          device={device}
          busy={pendingDeviceId === device.id}
          onConnect={() => device.id && onConnectDevice(device.id)}
          onDisconnect={() => device.id && onDisconnectDevice(device.id)}
        />
      ))}
    </PageFrame>
  )
}

function CalibrationPage({ flowMultiplier, resetSettings, updateMachineSetting, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="Calibration">
      <div className="settings-page__grid">
        <div className="settings-metric">
          <Metric
            metric={{ label: 'Flow Multiplier', value: flowMultiplier !== null ? String(flowMultiplier) : '—', unit: '×' }}
            edit={metricEdit('flowMultiplier', flowMultiplier ?? 1, settingsDisabled, (value) => updateMachineSetting('flowMultiplier', value))}
          />
        </div>
        <ButtonRow label="Machine Settings" description="Restore all machine settings to their factory defaults." onAction={resetSettings}>
          Reset settings
        </ButtonRow>
      </div>
    </PageFrame>
  )
}

function MachineFanPage({ machineSettings, updateMachineSetting, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="Fan Threshold">
      <div className="settings-page__grid">
        <div className="settings-metric">
          <Metric
            metric={{ label: 'Fan Threshold', value: String(machineSettings?.fan ?? '—'), unit: '°C' }}
            edit={metricEdit('fan', machineSettings?.fan, settingsDisabled, (value) => updateMachineSetting('fan', value))}
          />
        </div>
      </div>
    </PageFrame>
  )
}

function MachineUsbPage({ machineSettings, updateUsbCharger, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="USB Charger Mode">
      <ToggleRow
        label="USB Charger"
        description="When enabled, the machine's USB port can charge connected devices."
        checked={Boolean(machineSettings?.usb)}
        disabled={settingsDisabled}
        onChange={updateUsbCharger}
      />
    </PageFrame>
  )
}

function UpdatesAppPage(_props: SettingsPageProps) {
  const [latestVersion, setLatestVersion] = useState<string | undefined>()
  const [releaseNotes, setReleaseNotes] = useState<string | undefined>()
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    try {
      const response = await fetch('https://api.github.com/repos/dbarranco/bestpresso/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      if (response.ok) {
        const data = await response.json()
        setLatestVersion(data.tag_name?.replace(/^v/, ''))
        setReleaseNotes(data.body)
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    } finally {
      setChecking(false)
    }
  }

  // eslint-disable-next-line react/set-state-in-effect -- initial check on mount
  useEffect(() => { check() }, [])

  return (
    <PageFrame title="Bestpresso Update">
      <div className="update-card">
        <div className="update-card__header">
          <h3 className="update-card__title">Bestpresso</h3>
          <div className="update-card__version">
            v0.1.28
            {latestVersion && latestVersion !== '0.1.28' && <span className="update-card__latest"> → v{latestVersion}</span>}
          </div>
        </div>
        {latestVersion && latestVersion !== '0.1.28' && <div className="update-card__badge">Update available</div>}
        {releaseNotes && <div className="update-card__notes"><p>{releaseNotes.split('\n')[0]}</p></div>}
      </div>
      <ButtonRow label="Update Check" description="Check for a new version on GitHub." disabled={checking} onAction={check}>
        {checking ? 'Checking…' : 'Check for updates'}
      </ButtonRow>
    </PageFrame>
  )
}

function AboutPage(_props: SettingsPageProps) {
  return (
    <PageFrame title="About">
      <div className="about-info">
        <p className="about-info__text">Bestpresso is a companion app for Decent Espresso machines.</p>
        <div className="about-info__links">
          <a href="https://github.com/dbarranco/bestpresso" target="_blank" rel="noopener noreferrer" className="about-link">GitHub Repository</a>
          <a href="https://github.com/dbarranco/bestpresso/issues" target="_blank" rel="noopener noreferrer" className="about-link">Report Issues</a>
        </div>
      </div>
      <ButtonRow label="Version" description="Current installed version." onAction={() => window.open('https://github.com/dbarranco/bestpresso/releases', '_blank', 'noopener')}>
        v0.1.28 · View releases
      </ButtonRow>
    </PageFrame>
  )
}

function LastShotPage({ model }: SettingsPageProps) {
  const shot = model.previousShot
  if (!shot) return <ComingSoon title="Last Shot" />
  return (
    <PageFrame title="Last Shot">
      <div className="settings-page__grid">
        <StatusRow label="Profile" value={shot.profileName} />
        {shot.totalYield && <StatusRow label="Yield" value={shot.totalYield} />}
        {shot.totalTime && <StatusRow label="Time" value={shot.totalTime} />}
      </div>
    </PageFrame>
  )
}

const HANDBOOK_URL = 'https://www.decentespresso.com/insight'

function OnlineHelpPage(_props: SettingsPageProps) {
  return (
    <PageFrame title="Online Help">
      <div className="about-info">
        <div className="about-info__links">
          <a href={HANDBOOK_URL} target="_blank" rel="noopener noreferrer" className="about-link">Decent Espresso Docs</a>
          <a href="https://www.decentespresso.com/dev" target="_blank" rel="noopener noreferrer" className="about-link">Developer Resources</a>
        </div>
      </div>
    </PageFrame>
  )
}

function TutorialsPage(_props: SettingsPageProps) {
  return (
    <PageFrame title="Tutorials">
      <div className="about-info">
        <div className="about-info__links">
          <a href="https://www.youtube.com/@DecentEspresso" target="_blank" rel="noopener noreferrer" className="about-link">Decent Espresso Videos</a>
        </div>
      </div>
    </PageFrame>
  )
}

function CupWarmerPage({ cupWarmer, cupWarmerPreheat, updateCupWarmer, updateCupWarmerPreheat }: SettingsPageProps) {
  if (!cupWarmer) return <ComingSoon title="Cup Warmer" />
  return (
    <PageFrame title="Cup Warmer">
      <div className="settings-section__content">
        <ToggleRow
          label="Cup Warmer"
          description="Keeps cups warm on top of the machine."
          checked={Boolean(cupWarmer.enabled)}
          disabled={cupWarmer.enabled === undefined}
          onChange={(enabled) => updateCupWarmer({ enabled })}
        />
        {cupWarmer.temperature !== undefined && (
          <div className="settings-metric">
            <Metric
              metric={{ label: 'Temperature', value: String(cupWarmer.temperature), unit: '°C' }}
              edit={metricEdit('cupWarmerTemperature', cupWarmer.temperature, cupWarmer.enabled === undefined, (value) => updateCupWarmer({ temperature: value }))}
            />
          </div>
        )}
        {cupWarmer.currentTemperature !== undefined && (
          <StatusRow label="Current Temperature" value={`${cupWarmer.currentTemperature} °C`} />
        )}
        {cupWarmerPreheat && (
          <>
            <ToggleRow
              label="Preheat"
              description="Warm cups automatically before your typical brew time."
              checked={Boolean(cupWarmerPreheat.enabled)}
              disabled={cupWarmerPreheat.enabled === undefined}
              onChange={(enabled) => updateCupWarmerPreheat({ enabled })}
            />
            {cupWarmerPreheat.leadMinutes !== undefined && (
              <div className="settings-metric">
                <Metric
                  metric={{ label: 'Lead Time', value: String(cupWarmerPreheat.leadMinutes), unit: 'min' }}
                  edit={metricEdit('cupWarmerLeadMinutes', cupWarmerPreheat.leadMinutes, cupWarmerPreheat.enabled === undefined, (value) => updateCupWarmerPreheat({ leadMinutes: value }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageFrame>
  )
}

function SteamPurgePage({ machineSettings, updateMachineSetting, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="Steam Purge Mode">
      <div className="settings-page__grid">
        <div className="settings-metric">
          <Metric
            metric={{ label: 'Steam Purge Mode', value: String(machineSettings?.steamPurgeMode ?? '—') }}
            edit={metricEdit('steamPurgeMode', machineSettings?.steamPurgeMode, settingsDisabled, (value) => updateMachineSetting('steamPurgeMode', value))}
          />
        </div>
        <p className="settings-row__description">Controls how the steam wand purges after steaming. Only change this if you understand the underlying machine setting.</p>
      </div>
    </PageFrame>
  )
}

const HEATER_VOLTAGE_OPTIONS = [
  { value: '-1', label: 'Auto / unset' },
  { value: '120', label: '120 V' },
  { value: '230', label: '230 V' },
]

const REFILL_KIT_OPTIONS = [
  { value: '2', label: 'Auto' },
  { value: '1', label: 'Force on' },
  { value: '0', label: 'Force off' },
]

function MachineAdvancedPage({ advancedSettings, updateMachineSetting, updateAdvancedSetting, settingsDisabled }: SettingsPageProps) {
  return (
    <PageFrame title="Advanced">
      <div className="settings-section__content">
        <p className="settings-row__description">Advanced heater and pump settings. Leave these at their defaults unless you know what you are doing.</p>
        <SelectRow
          label="Heater Voltage"
          description="Mains voltage the heater expects."
          value={advancedSettings?.heaterVoltage != null ? String(advancedSettings.heaterVoltage) : '-1'}
          options={HEATER_VOLTAGE_OPTIONS}
          disabled={settingsDisabled}
          onChange={(value) => updateAdvancedSetting({ heaterVoltage: Number(value) })}
        />
        <SelectRow
          label="Refill Kit"
          description="How the refill kit (optional hardware) behaves."
          value={advancedSettings?.refillKitSetting != null ? String(advancedSettings.refillKitSetting) : '2'}
          options={REFILL_KIT_OPTIONS}
          disabled={settingsDisabled}
          onChange={(value) => updateAdvancedSetting({ refillKitSetting: Number(value) })}
        />
        <div className="settings-section__subsection">
          <h3 className="settings-section__subtitle">Heater</h3>
          {advancedSettings?.heaterPh1Flow !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Phase 1 Flow', value: String(advancedSettings.heaterPh1Flow), unit: 'ml/min' }}
                edit={metricEdit('heaterPh1Flow', advancedSettings.heaterPh1Flow, settingsDisabled, (value) => updateMachineSetting('heaterPh1Flow', value))}
              />
            </div>
          )}
          {advancedSettings?.heaterPh2Flow !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Phase 2 Flow', value: String(advancedSettings.heaterPh2Flow), unit: 'ml/min' }}
                edit={metricEdit('heaterPh2Flow', advancedSettings.heaterPh2Flow, settingsDisabled, (value) => updateMachineSetting('heaterPh2Flow', value))}
              />
            </div>
          )}
          {advancedSettings?.heaterIdleTemp !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Idle Temperature', value: String(advancedSettings.heaterIdleTemp), unit: '°C' }}
                edit={metricEdit('heaterIdleTemp', advancedSettings.heaterIdleTemp, settingsDisabled, (value) => updateMachineSetting('heaterIdleTemp', value))}
              />
            </div>
          )}
          {advancedSettings?.heaterPh2Timeout !== undefined && (
            <div className="settings-metric">
              <Metric
                metric={{ label: 'Phase 2 Timeout', value: String(advancedSettings.heaterPh2Timeout), unit: 'min' }}
                edit={metricEdit('heaterPh2Timeout', advancedSettings.heaterPh2Timeout, settingsDisabled, (value) => updateMachineSetting('heaterPh2Timeout', value))}
              />
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

function ScaleCalibrationPage({ onScaleCalibration }: SettingsPageProps) {
  return (
    <PageFrame title="Scale Calibration">
      <div className="settings-page__grid">
        <p className="settings-row__description">Place a known weight on the scale, then tap Latch to record it. This requires a connected scale.</p>
        <ButtonRow label="Zero Scale" description="Record the empty scale as zero." onAction={() => onScaleCalibration('zero')}>
          Zero
        </ButtonRow>
        <ButtonRow label="Latch" description="Record the weight currently on the scale." onAction={() => onScaleCalibration('latch', 500)}>
          Latch 500 g
        </ButtonRow>
        <ButtonRow label="Abort" description="Cancel any calibration in progress." onAction={() => onScaleCalibration('abort')}>
          Abort
        </ButtonRow>
      </div>
    </PageFrame>
  )
}

function BrightnessPage({ displayBrightness, setBrightness }: SettingsPageProps) {
  return (
    <PageFrame title="Brightness">
      <div className="settings-page__grid">
        <div className="settings-metric">
          <Metric
            metric={{ label: 'Brightness', value: String(displayBrightness ?? '—'), unit: '%' }}
            edit={displayBrightness !== null && displayBrightness !== undefined
              ? metricEdit('brightness', displayBrightness, false, setBrightness)
              : undefined}
          />
        </div>
      </div>
    </PageFrame>
  )
}

const SCALE_POWER_MODE_OPTIONS = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'displayOff', label: 'Display off' },
  { value: 'disconnect', label: 'Disconnect at low battery' },
]

function OptionsPage({ storeSettings, updateStoreSetting, settingsDisabled }: SettingsPageProps) {
  if (!storeSettings) return <ComingSoon title="Options" />
  return (
    <PageFrame title="Options">
      <div className="settings-page__grid">
        <SelectRow
          label="Scale Power Mode"
          description="How the machine manages scale power."
          value={storeSettings.scalePowerMode ?? 'disabled'}
          options={SCALE_POWER_MODE_OPTIONS}
          disabled={settingsDisabled}
          onChange={(value) => updateStoreSetting({ scalePowerMode: value as 'disabled' | 'displayOff' | 'disconnect' })}
        />
        <ToggleRow
          label="Block Shot Without Scale"
          description="Refuse to start a shot when no scale is connected."
          checked={Boolean(storeSettings.blockOnNoScale)}
          disabled={settingsDisabled}
          onChange={(blockOnNoScale) => updateStoreSetting({ blockOnNoScale })}
        />
        <ToggleRow
          label="Block Tare During Shot"
          description="Prevent tare while a shot is running."
          checked={Boolean(storeSettings.blockTareDuringShot)}
          disabled={settingsDisabled}
          onChange={(blockTareDuringShot) => updateStoreSetting({ blockTareDuringShot })}
        />
        <ToggleRow
          label="Stop Hot Water at Weight"
          description="End hot water dispensing when the target weight is reached."
          checked={Boolean(storeSettings.stopHotWaterAtWeight)}
          disabled={settingsDisabled}
          onChange={(stopHotWaterAtWeight) => updateStoreSetting({ stopHotWaterAtWeight })}
        />
        <ToggleRow
          label="Automatic Update Check"
          description="Automatically check for new app versions."
          checked={Boolean(storeSettings.automaticUpdateCheck)}
          disabled={settingsDisabled}
          onChange={(automaticUpdateCheck) => updateStoreSetting({ automaticUpdateCheck })}
        />
        <ToggleRow
          label="Keep Awake"
          description="Keep the display awake while the app is open."
          checked={Boolean(storeSettings.keepAwake)}
          disabled={settingsDisabled}
          onChange={(keepAwake) => updateStoreSetting({ keepAwake })}
        />
      </div>
    </PageFrame>
  )
}

function SkinPage({ skins, defaultSkinId, onSelectSkin }: SettingsPageProps) {
  if (skins.length === 0) return <ComingSoon title="Skin" />
  return (
    <PageFrame title="Skin">
      <p className="settings-row__description">Choose which skin Decaid serves when you launch it in the browser.</p>
      <SelectRow
        label="Default Skin"
        value={defaultSkinId ?? ''}
        options={skins.map((skin) => ({ value: skin.id ?? '', label: skin.name || skin.id || 'Unknown' }))}
        onChange={onSelectSkin}
      />
    </PageFrame>
  )
}

export const SETTINGS_PAGES = {
  steam: SteamPage,
  hotWater: HotWaterPage,
  waterTank: WaterTankPage,
  flush: FlushPage,
  brewProfile: BrewProfilePage,
  cupWarmer: CupWarmerPage,
  bleMachine: BluetoothMachinePage,
  bleScale: BluetoothScalePage,
  calibration: CalibrationPage,
  scaleCalibration: ScaleCalibrationPage,
  machineFan: MachineFanPage,
  machineUsb: MachineUsbPage,
  steamPurge: SteamPurgePage,
  machineAdvanced: MachineAdvancedPage,
  skin: SkinPage,
  brightness: BrightnessPage,
  options: OptionsPage,
  machineStatus: MachineStatusPage,
  about: AboutPage,
  lastShot: LastShotPage,
  updatesApp: UpdatesAppPage,
  onlineHelp: OnlineHelpPage,
  tutorials: TutorialsPage,
} satisfies Record<SettingsPageKey, (props: SettingsPageProps) => ReactNode>