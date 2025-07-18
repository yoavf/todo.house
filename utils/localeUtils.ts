/**
 * Centralized locale utilities for consistent locale handling
 */
import * as Localization from 'expo-localization'

/**
 * Get the current locale with fallback to en-US
 * Sanitizes locale to remove POSIX modifiers like @posix
 */
export const getCurrentLocale = (): string => {
  const locales = Localization.getLocales()
  const locale = locales?.[0]
  const languageTag = locale?.languageTag || 'en-US'

  // Remove POSIX modifiers like @posix which are not valid for Intl API
  return languageTag.split('@')[0]
}

/**
 * Get the current locale region with fallback
 */
export const getCurrentRegion = (): string => {
  const locales = Localization.getLocales()
  const locale = locales?.[0]
  return locale?.regionCode || 'US'
}
