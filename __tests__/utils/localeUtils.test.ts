import * as Localization from 'expo-localization'
import { getCurrentLocale, getCurrentRegion } from '../../utils/localeUtils'

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}))

describe('localeUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentLocale', () => {
    it('returns locale language tag when available', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([
        { languageTag: 'fr-FR', regionCode: 'FR' },
      ])

      const locale = getCurrentLocale()
      expect(locale).toBe('fr-FR')
    })

    it('returns en-US as fallback when no locales available', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([])

      const locale = getCurrentLocale()
      expect(locale).toBe('en-US')
    })

    it('returns en-US as fallback when locale has no languageTag', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([
        { regionCode: 'FR' }, // No languageTag
      ])

      const locale = getCurrentLocale()
      expect(locale).toBe('en-US')
    })

    it('returns en-US as fallback when getLocales returns null', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue(null)

      const locale = getCurrentLocale()
      expect(locale).toBe('en-US')
    })

    it('returns en-US as fallback when getLocales returns undefined', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue(undefined)

      const locale = getCurrentLocale()
      expect(locale).toBe('en-US')
    })
  })

  describe('getCurrentRegion', () => {
    it('returns region code when available', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([
        { languageTag: 'fr-FR', regionCode: 'FR' },
      ])

      const region = getCurrentRegion()
      expect(region).toBe('FR')
    })

    it('returns US as fallback when no locales available', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([])

      const region = getCurrentRegion()
      expect(region).toBe('US')
    })

    it('returns US as fallback when locale has no regionCode', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([
        { languageTag: 'fr-FR' }, // No regionCode
      ])

      const region = getCurrentRegion()
      expect(region).toBe('US')
    })

    it('returns US as fallback when getLocales returns null', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue(null)

      const region = getCurrentRegion()
      expect(region).toBe('US')
    })

    it('handles multiple locales by using the first one', () => {
      ;(Localization.getLocales as jest.Mock).mockReturnValue([
        { languageTag: 'fr-FR', regionCode: 'FR' },
        { languageTag: 'en-US', regionCode: 'US' },
        { languageTag: 'es-ES', regionCode: 'ES' },
      ])

      const locale = getCurrentLocale()
      const region = getCurrentRegion()

      expect(locale).toBe('fr-FR')
      expect(region).toBe('FR')
    })
  })
})
