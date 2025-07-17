/**
 * Centralized locale utilities for consistent locale handling
 */
import * as Localization from 'expo-localization';

/**
 * Get the current locale with fallback to en-US
 */
export const getCurrentLocale = (): string => {
  const locale = Localization.getLocales()[0];
  return locale?.languageTag || 'en-US';
};

/**
 * Get the current locale region with fallback
 */
export const getCurrentRegion = (): string => {
  const locale = Localization.getLocales()[0];
  return locale?.regionCode || 'US';
};