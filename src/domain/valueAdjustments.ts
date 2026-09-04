import type { EditableMachineSetting, EditableProfileSetting } from './brewing'

export type ValueAdjustmentKey = EditableMachineSetting | EditableProfileSetting | 'brightness'
export type ValueAdjustmentMode = 'integer' | 'decimal'

export interface FixedValueSuggestion {
  label: string
  detail: string
  value: number
}

export interface ValueAdjustmentDefinition {
  title: string
  min: number
  max: number
  step: number
  mode: ValueAdjustmentMode
  defaultValue?: number
  suggestions: readonly number[]
}

export const MAX_VALUE_SUGGESTIONS = 8

export const VALUE_ADJUSTMENTS = {
  hotWaterVolume: {
    title: 'Hot water volume',
    min: 0,
    max: 250,
    step: 1,
    mode: 'integer',
    suggestions: [],
  },
  hotWaterTemperature: {
    title: 'Hot water temperature',
    min: 50,
    max: 95,
    step: 1,
    mode: 'integer',
    suggestions: [],
  },
  steamTemperature: {
    title: 'Steam target temperature',
    min: 135,
    max: 170,
    step: 1,
    mode: 'integer',
    suggestions: [150, 155, 160, 165, 170],
  },
  steamDuration: {
    title: 'Steam duration',
    min: 0,
    max: 120,
    step: 1,
    mode: 'integer',
    suggestions: [],
  },
  steamFlow: {
    title: 'Steam flow',
    min: 0.4,
    max: 2.5,
    step: 0.1,
    mode: 'decimal',
    suggestions: [0.6, 0.8, 1, 1.2, 1.4],
  },
  flushTemp: {
    title: 'Flush temperature',
    min: 50,
    max: 100,
    step: 1,
    mode: 'integer',
    suggestions: [80, 88, 90, 92, 95],
  },
  flushTimeout: {
    title: 'Flush timeout',
    min: 1,
    max: 30,
    step: 1,
    mode: 'integer',
    suggestions: [5, 10, 15, 20],
  },
  flushFlow: {
    title: 'Flush flow',
    min: 1,
    max: 8,
    step: 0.1,
    mode: 'decimal',
    suggestions: [2, 3, 4, 5],
  },
  fan: {
    title: 'Fan threshold',
    min: 20,
    max: 100,
    step: 1,
    mode: 'integer',
    suggestions: [40, 50, 60, 70],
  },
  heaterVoltage: {
    title: 'Heater voltage',
    min: 100,
    max: 300,
    step: 1,
    mode: 'integer',
    suggestions: [120, 230, 240],
  },
  steamPurgeMode: {
    title: 'Steam purge mode',
    min: 0,
    max: 2,
    step: 1,
    mode: 'integer',
    suggestions: [0, 1, 2],
  },
  heaterPh1Flow: {
    title: 'Heater phase 1 flow',
    min: 0,
    max: 10,
    step: 0.1,
    mode: 'decimal',
    suggestions: [1, 2, 3, 4],
  },
  heaterPh2Flow: {
    title: 'Heater phase 2 flow',
    min: 0,
    max: 10,
    step: 0.1,
    mode: 'decimal',
    suggestions: [2, 4, 6, 8],
  },
  heaterIdleTemp: {
    title: 'Heater idle temperature',
    min: 30,
    max: 120,
    step: 1,
    mode: 'integer',
    suggestions: [60, 70, 80, 90],
  },
  heaterPh2Timeout: {
    title: 'Heater phase 2 timeout',
    min: 1,
    max: 60,
    step: 1,
    mode: 'integer',
    suggestions: [5, 10, 20, 30],
  },
  cupWarmerTemperature: {
    title: 'Cup warmer temperature',
    min: 0,
    max: 80,
    step: 1,
    mode: 'integer',
    suggestions: [45, 50, 55, 60, 65],
  },
  cupWarmerLeadMinutes: {
    title: 'Preheat lead time',
    min: 0,
    max: 120,
    step: 5,
    mode: 'integer',
    suggestions: [15, 30, 45, 60],
  },
  brightness: {
    title: 'Brightness',
    min: 0,
    max: 100,
    step: 10,
    mode: 'integer',
    suggestions: [30, 50, 70, 100],
  },
  flowMultiplier: {
    title: 'Flow multiplier',
    min: 0.5,
    max: 2,
    step: 0.01,
    mode: 'decimal',
    defaultValue: 1,
    suggestions: [0.8, 0.9, 1, 1.1, 1.2],
  },
  temperature: {
    title: 'Brew temperature',
    min: 80,
    max: 100,
    step: 1,
    mode: 'integer',
    suggestions: [86, 88, 90, 92, 94, 96, 98],
  },
  grindSetting: {
    title: 'Grind size',
    min: 0,
    max: 2500,
    step: 0.1,
    mode: 'decimal',
    defaultValue: 20,
    suggestions: [],
  },
  dose: {
    title: 'Dose',
    min: 0,
    max: 30,
    step: 0.1,
    mode: 'decimal',
    defaultValue: 18,
    suggestions: [7, 16, 18, 20, 22, 24],
  },
  targetYield: {
    title: 'Yield',
    min: 0,
    max: 1000,
    step: 0.1,
    mode: 'decimal',
    defaultValue: 36,
    suggestions: [14, 18, 20, 36, 40, 44, 48, 50],
  },
} as const satisfies Record<ValueAdjustmentKey, ValueAdjustmentDefinition>
