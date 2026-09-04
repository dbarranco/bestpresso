import { useEffect, useState } from 'react'
import settingsBackIcon from '../../assets/figma/profiles-back.svg'
import { Metric } from '../../components/Metric/Metric'
import type { BrewingScreenModel, EditableMachineSetting, MachineUtility, ScaleConnection, SettingFeedback } from '../../domain/brewing'
import { VALUE_ADJUSTMENTS } from '../../domain/valueAdjustments'
import { MachineUtilityCard } from '../machine/MachineUtilityCard'

interface UpdateInfo {
  type: 'app' | 'machine'
  currentVersion: string
  latestVersion?: string
  updateAvailable: boolean
  releaseNotes?: string
}

const APP_VERSION = '0.1.26'

const editForMachineSetting = (utility: MachineUtility, label: string, onSave?: (setting: EditableMachineSetting, value: number) => void, disabled?: boolean) => {
  if (!onSave) return undefined
  const setting: EditableMachineSetting | undefined = utility.id === 'water' && label === 'Volume'
    ? 'hotWaterVolume'
    : utility.id === 'water' && label === 'Temperature'
      ? 'hotWaterTemperature'
      : utility.id === 'steam' && label === 'Target'
        ? 'steamTemperature'
        : utility.id === 'steam' && label === 'Duration'
          ? 'steamDuration'
          : utility.id === 'steam' && label === 'Flow'
            ? 'steamFlow'
            : undefined
  if (!setting) return undefined

  const definition = VALUE_ADJUSTMENTS[setting]
  return {
    title: definition.title,
    min: definition.min,
    max: definition.max,
    step: definition.step,
    mode: definition.mode,
    suggestionKey: setting,
    presets: definition.suggestions,
    disabled,
    onSave: (value: number) => onSave(setting, value),
  }
}

interface SettingsPanelProps {
  model: BrewingScreenModel
  feedback: SettingFeedback | null
  scale?: ScaleConnection
  scaleTarePending?: boolean
  settingsDisabled?: boolean
  onUpdateMachineSetting: (setting: EditableMachineSetting, value: number) => void
  onSearchScale?: () => void
  onTareScale?: () => void
  onClose: () => void
}

export function SettingsPanel({
  model,
  feedback,
  scale,
  scaleTarePending,
  settingsDisabled,
  onUpdateMachineSetting,
  onSearchScale,
  onTareScale,
  onClose,
}: SettingsPanelProps) {
  const [updates, setUpdates] = useState<UpdateInfo[]>([
    { type: 'app', currentVersion: APP_VERSION, updateAvailable: false },
  ])
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true)
    try {
      // Check for app updates from GitHub
      const response = await fetch('https://api.github.com/repos/dbarranco/bestpresso/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      })
      if (response.ok) {
        const data = await response.json()
        const latestVersion = data.tag_name?.replace(/^v/, '')
        setUpdates((prev) =>
          prev.map((update) =>
            update.type === 'app'
              ? {
                  ...update,
                  latestVersion,
                  updateAvailable: latestVersion && latestVersion !== APP_VERSION ? true : false,
                  releaseNotes: data.body,
                }
              : update,
          ),
        )
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    } finally {
      setCheckingUpdates(false)
    }
  }

  useEffect(() => {
    // Auto-check for updates on mount
    handleCheckUpdates()
  }, [])

  const steamUtility = model.utilities.find((u) => u.id === 'steam')
  const waterUtility = model.utilities.find((u) => u.id === 'water')
  const scaleUtility = model.utilities.find((u) => u.id === 'scale')

  return (
    <section className="settings-panel">
      <header className="settings-panel__header">
        <button
          className="settings-panel__back"
          type="button"
          aria-label="Back to brewing"
          title="Back"
          onClick={onClose}
        >
          <img src={settingsBackIcon} alt="" />
        </button>
        <h1 className="settings-panel__title">Settings</h1>
        <div className="settings-panel__spacer" />
      </header>

      {feedback && (
        <div className="settings-panel__feedback">
          <div className={`system-message system-message--${feedback.status}`} role="status" aria-live="polite">
            {feedback.message}
          </div>
        </div>
      )}

      <div className="settings-panel__content">
        {/* Machine Settings */}
        <section className="settings-section">
          <h2 className="settings-section__title">Machine Settings</h2>
          <div className="settings-section__content">
            {steamUtility && (
              <div className="settings-section__subsection">
                <h3 className="settings-section__subtitle">Steam</h3>
                {steamUtility.metrics.map((metric) => (
                  <div key={metric.label} className="settings-metric">
                    <Metric
                      metric={metric}
                      edit={editForMachineSetting(steamUtility, metric.label, onUpdateMachineSetting, settingsDisabled)}
                    />
                  </div>
                ))}
              </div>
            )}

            {waterUtility && (
              <div className="settings-section__subsection">
                <h3 className="settings-section__subtitle">Hot Water</h3>
                {waterUtility.metrics.map((metric) => (
                  <div key={metric.label} className="settings-metric">
                    <Metric
                      metric={metric}
                      edit={editForMachineSetting(waterUtility, metric.label, onUpdateMachineSetting, settingsDisabled)}
                    />
                  </div>
                ))}
              </div>
            )}

            {scaleUtility && (
              <div className="settings-section__subsection">
                <h3 className="settings-section__subtitle">Scale</h3>
                <MachineUtilityCard
                  utility={scaleUtility}
                  scale={scale}
                  scaleTarePending={scaleTarePending}
                  settingsDisabled={settingsDisabled}
                  onSearchScale={onSearchScale}
                  onTareScale={onTareScale}
                  onUpdateSetting={onUpdateMachineSetting}
                />
              </div>
            )}
          </div>
        </section>

        {/* Updates */}
        <section className="settings-section">
          <h2 className="settings-section__title">Updates</h2>
          <div className="settings-section__content">
            {updates.map((update) => (
              <div key={update.type} className="settings-section__subsection">
                <div className="update-card">
                  <div className="update-card__header">
                    <h3 className="update-card__title">{update.type === 'app' ? 'Bestpresso' : 'Machine Firmware'}</h3>
                    <div className="update-card__version">
                      v{update.currentVersion}
                      {update.latestVersion && update.latestVersion !== update.currentVersion && (
                        <span className="update-card__latest"> → v{update.latestVersion}</span>
                      )}
                    </div>
                  </div>
                  {update.updateAvailable && (
                    <div className="update-card__badge">Update available</div>
                  )}
                  {update.releaseNotes && (
                    <div className="update-card__notes">
                      <p>{update.releaseNotes.split('\n')[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              className="settings-section__button"
              type="button"
              disabled={checkingUpdates}
              onClick={handleCheckUpdates}
            >
              {checkingUpdates ? 'Checking...' : 'Check for updates'}
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h2 className="settings-section__title">About</h2>
          <div className="settings-section__content">
            <div className="about-info">
              <p className="about-info__text">Bestpresso is a companion app for Decent Espresso machines.</p>
              <div className="about-info__links">
                <a href="https://github.com/dbarranco/bestpresso" target="_blank" rel="noopener noreferrer" className="about-link">
                  GitHub Repository
                </a>
                <a href="https://github.com/dbarranco/bestpresso/issues" target="_blank" rel="noopener noreferrer" className="about-link">
                  Report Issues
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
