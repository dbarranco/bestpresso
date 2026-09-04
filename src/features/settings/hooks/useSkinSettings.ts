import { useCallback, useEffect, useState } from 'react'
import { getDefaultSkin, getSkins, setDefaultSkin as setDefaultSkinApi } from '../../../api/decaid/client'
import type { SkinRecord } from '../../../api/decaid/types'

type Feedback = (status: 'saving' | 'saved' | 'error', message: string) => void

export function useSkinSettings(onFeedback: Feedback) {
  const [skins, setSkins] = useState<SkinRecord[]>([])
  const [defaultSkinId, setDefaultSkinId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [skinList, defaultSkin] = await Promise.all([getSkins(), getDefaultSkin()])
      setSkins(skinList)
      setDefaultSkinId(defaultSkin?.id ?? skinList[0]?.id ?? null)
    } catch (error) {
      console.error('Failed to fetch skins:', error)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setDefaultSkin = useCallback(async (skinId: string) => {
    try {
      onFeedback('saving', 'Setting skin...')
      await setDefaultSkinApi(skinId)
      setDefaultSkinId(skinId)
      onFeedback('saved', 'Skin changed')
    } catch (error) {
      console.error('Failed to set skin:', error)
      onFeedback('error', error instanceof Error ? error.message : 'Failed to set skin')
    }
  }, [onFeedback])

  return { skins, defaultSkinId, setDefaultSkin }
}