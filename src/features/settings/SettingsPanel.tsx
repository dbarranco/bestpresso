import { useState } from 'react'
import settingsBackIcon from '../../assets/figma/profiles-back.svg'
import type { BrewingScreenModel, ScaleConnection, SettingFeedback } from '../../domain/brewing'
import { settingsPageForSubcategory } from '../../domain/settingsTree'
import { SettingsNav, resolveDefaultSelection } from './SettingsNav'
import { SETTINGS_PAGES } from './SettingsPages'
import type { SettingsPageProps } from './SettingsPages'
import { useProfileSettings } from './hooks/useProfileSettings'
import { useMachineSettings } from './hooks/useMachineSettings'
import { useBluetoothDevices } from './hooks/useBluetoothDevices'
import { useSkinSettings } from './hooks/useSkinSettings'

interface SettingsPanelProps {
  model: BrewingScreenModel
  feedback: SettingFeedback | null
  scale?: ScaleConnection
  scaleTarePending?: boolean
  settingsDisabled?: boolean
  onFeedback?: (status: 'saving' | 'saved' | 'error', message: string) => void
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
  onFeedback,
  onSearchScale,
  onTareScale,
  onClose,
}: SettingsPanelProps) {
  const noOpFeedback = () => {}
  const feedbackHandler = onFeedback || noOpFeedback
  const [selection, setSelection] = useState(resolveDefaultSelection)

  const { updateProfileSetting } = useProfileSettings(feedbackHandler)
  const { updateMachineSetting, updateUsbCharger, updateCupWarmer, updateCupWarmerPreheat, updateAdvancedSetting, setBrightness, updateStoreSetting, onScaleCalibration, resetSettings, machineSettings, advancedSettings, flowMultiplier, cupWarmer, cupWarmerPreheat, displayBrightness, storeSettings } = useMachineSettings(feedbackHandler)
  const { devices, scanning, pendingDeviceId, scan, connect, disconnect } = useBluetoothDevices(feedbackHandler)
  const { skins, defaultSkinId, setDefaultSkin } = useSkinSettings(feedbackHandler)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- every tree subcategory maps to a registered page
  const PageContent = SETTINGS_PAGES[settingsPageForSubcategory(selection.subcategoryId)!]

  const handleSwitchSkin = () => {
    // Redirect to Streamline.js (typically at port 3000)
    const host = window.location.hostname
    const port = 3000
    window.location.href = `http://${host}:${port}`
  }

  const pageProps: SettingsPageProps = {
    model,
    feedback,
    scale,
    scaleTarePending,
    settingsDisabled,
    onSearchScale,
    onTareScale,
    updateProfileSetting,
    updateMachineSetting,
    updateUsbCharger,
    updateCupWarmer,
    updateCupWarmerPreheat,
    updateAdvancedSetting,
    setBrightness,
    updateStoreSetting,
    onScaleCalibration,
    resetSettings,
    machineSettings,
    advancedSettings,
    flowMultiplier,
    cupWarmer,
    cupWarmerPreheat,
    displayBrightness,
    storeSettings,
    devices,
    scanning,
    pendingDeviceId,
    onScanDevices: scan,
    onConnectDevice: connect,
    onDisconnectDevice: disconnect,
    skins,
    defaultSkinId,
    onSelectSkin: setDefaultSkin,
  }

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
        <button
          className="settings-panel__skin-switcher"
          type="button"
          title="Switch to Streamline"
          onClick={handleSwitchSkin}
        >
          📱 Streamline
        </button>
      </header>

      {feedback && (
        <div className="settings-panel__feedback">
          <div className={`system-message system-message--${feedback.status}`} role="status" aria-live="polite">
            {feedback.message}
          </div>
        </div>
      )}

      <div className="settings-panel__body">
        <SettingsNav
          selectedCategoryId={selection.categoryId}
          selectedSubcategoryId={selection.subcategoryId}
          onSelect={(categoryId, subcategoryId) => setSelection({ categoryId, subcategoryId })}
        />
        <main className="settings-content">
          <PageContent {...pageProps} />
        </main>
      </div>
    </section>
  )
}