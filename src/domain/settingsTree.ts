export type SettingsPageKey =
  | 'steam'
  | 'hotWater'
  | 'waterTank'
  | 'flush'
  | 'brewProfile'
  | 'cupWarmer'
  | 'bleMachine'
  | 'bleScale'
  | 'calibration'
  | 'scaleCalibration'
  | 'machineFan'
  | 'machineUsb'
  | 'steamPurge'
  | 'machineAdvanced'
  | 'skin'
  | 'brightness'
  | 'options'
  | 'machineStatus'
  | 'about'
  | 'lastShot'
  | 'updatesApp'
  | 'onlineHelp'
  | 'tutorials'

export interface SettingsSubcategory {
  id: string
  name: string
  page: SettingsPageKey
}

export interface SettingsCategory {
  id: string
  name: string
  subcategories: SettingsSubcategory[]
}

export interface SettingsSearchMatch {
  categoryId: string
  categoryName: string
  subcategory: SettingsSubcategory
}

export const SETTINGS_TREE: SettingsCategory[] = [
  {
    id: 'quick-adjustments',
    name: 'Quick Adjustments',
    subcategories: [
      { id: 'steam', name: 'Steam', page: 'steam' },
      { id: 'hot-water', name: 'Hot Water', page: 'hotWater' },
      { id: 'water-tank', name: 'Water Tank', page: 'waterTank' },
      { id: 'flush', name: 'Flush', page: 'flush' },
      { id: 'brew-profile', name: 'Brew Profile', page: 'brewProfile' },
      { id: 'cup-warmer', name: 'Cup Warmer', page: 'cupWarmer' },
    ],
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth',
    subcategories: [
      { id: 'machine', name: 'Machine', page: 'bleMachine' },
      { id: 'scale', name: 'Scale', page: 'bleScale' },
    ],
  },
  {
    id: 'calibration',
    name: 'Calibration',
    subcategories: [
      { id: 'flow-multiplier', name: 'Flow Multiplier', page: 'calibration' },
      { id: 'scale-calibration', name: 'Scale Calibration', page: 'scaleCalibration' },
    ],
  },
  {
    id: 'machine',
    name: 'Machine',
    subcategories: [
      { id: 'fan-threshold', name: 'Fan Threshold', page: 'machineFan' },
      { id: 'usb-charger-mode', name: 'USB Charger Mode', page: 'machineUsb' },
      { id: 'steam-purge-mode', name: 'Steam Purge Mode', page: 'steamPurge' },
      { id: 'advanced', name: 'Advanced', page: 'machineAdvanced' },
    ],
  },
  {
    id: 'skin',
    name: 'Skin',
    subcategories: [
      { id: 'select-skin', name: 'Select Skin', page: 'skin' },
    ],
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    subcategories: [
      { id: 'machine-status', name: 'Machine Status', page: 'machineStatus' },
      { id: 'brightness', name: 'Brightness', page: 'brightness' },
      { id: 'options', name: 'Options', page: 'options' },
      { id: 'about', name: 'About', page: 'about' },
      { id: 'last-shot', name: 'Last Shot', page: 'lastShot' },
    ],
  },
  {
    id: 'updates',
    name: 'Updates',
    subcategories: [
      { id: 'bestpresso', name: 'Bestpresso', page: 'updatesApp' },
    ],
  },
  {
    id: 'user-manual',
    name: 'User Manual',
    subcategories: [
      { id: 'online-help', name: 'Online Help', page: 'onlineHelp' },
      { id: 'tutorials', name: 'Tutorials', page: 'tutorials' },
    ],
  },
]

export function settingsCategory(categoryId: string) {
  return SETTINGS_TREE.find((category) => category.id === categoryId)
}

export function settingsSubcategory(subcategoryId: string) {
  for (const category of SETTINGS_TREE) {
    const subcategory = category.subcategories.find((item) => item.id === subcategoryId)
    if (subcategory) return subcategory
  }
  return undefined
}

export function settingsPageForSubcategory(subcategoryId: string): SettingsPageKey | undefined {
  return settingsSubcategory(subcategoryId)?.page
}

export function searchSettings(query: string): SettingsSearchMatch[] {
  const term = query.trim().toLowerCase()
  if (!term) return []

  const matches: SettingsSearchMatch[] = []
  for (const category of SETTINGS_TREE) {
    const categoryMatches = category.name.toLowerCase().includes(term)
    for (const subcategory of category.subcategories) {
      if (categoryMatches || subcategory.name.toLowerCase().includes(term)) {
        matches.push({ categoryId: category.id, categoryName: category.name, subcategory })
      }
    }
  }
  return matches
}