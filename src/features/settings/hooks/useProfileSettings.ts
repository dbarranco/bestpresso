import { useCallback } from 'react'
import { updateWorkflow } from '../../../api/decaid/client'
import type { EditableProfileSetting } from '../../../domain/brewing'

export function useProfileSettings(onFeedback: (status: 'saving' | 'saved' | 'error', message: string) => void) {
  const updateProfileSetting = useCallback(async (setting: EditableProfileSetting, value: number) => {
    try {
      onFeedback('saving', 'Updating profile setting...')

      const patch: Record<string, unknown> = {}

      if (setting === 'temperature') {
        patch.profile = { steps: [{ temperature: value }] }
      } else if (setting === 'grindSetting') {
        patch.context = { grinderSetting: String(value) }
      } else if (setting === 'dose') {
        patch.context = { targetDoseWeight: value }
      } else if (setting === 'targetYield') {
        patch.context = { targetYield: value }
      }

      await updateWorkflow(patch)
      onFeedback('saved', 'Profile setting updated')
    } catch (error) {
      console.error('Failed to update profile setting:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to update profile setting')
    }
  }, [onFeedback])

  return { updateProfileSetting }
}
