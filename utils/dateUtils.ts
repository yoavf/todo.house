/**
 * Utility functions for consistent date handling across the app
 */

import * as Localization from 'expo-localization'
import { SnoozeDuration } from '../types/Task'
import {
  DEFAULT_MORNING_HOUR,
  DEFAULT_MORNING_MINUTE,
  DEFAULT_MORNING_SECOND,
  MILLISECONDS_PER_DAY,
} from './constants'
import { getCurrentLocale, getCurrentRegion } from './localeUtils'

const { Weekday } = Localization

/**
 * Safely parses a date field from stored data
 * Handles both string dates and undefined values
 */
export const parseDateField = (dateValue: unknown): Date | undefined => {
  if (!dateValue) {
    return undefined
  }

  if (dateValue instanceof Date) {
    return dateValue
  }

  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  return undefined
}

/**
 * Safely parses a required date field from stored data
 * Returns current date if parsing fails
 */
export const parseRequiredDateField = (dateValue: unknown): Date => {
  const parsed = parseDateField(dateValue)
  return parsed || new Date()
}

/**
 * Weekend configuration by locale using expo-localization standards
 */
export interface WeekendConfig {
  start: number // Using Weekday constants: Sunday=1, Monday=2, ..., Saturday=7
  end: number
}

/**
 * Get weekend configuration for a locale using proper expo-localization APIs
 * Uses region detection instead of string matching
 */
export const getWeekendConfig = (_locale?: string): WeekendConfig => {
  const region = getCurrentRegion()

  // Israel: Friday-Saturday weekend
  if (region === 'IL') {
    return { start: Weekday.FRIDAY, end: Weekday.SATURDAY } // 6-7
  }

  // Many Middle Eastern countries: Friday-Saturday
  if (['SA', 'AE', 'BH', 'KW', 'QA'].includes(region)) {
    return { start: Weekday.FRIDAY, end: Weekday.SATURDAY } // 6-7
  }

  // Default: Saturday-Sunday weekend
  return { start: Weekday.SATURDAY, end: Weekday.SUNDAY } // 7-1
}

/**
 * Get the first day of the work week for a locale
 */
export const getFirstWorkday = (locale?: string): number => {
  const weekend = getWeekendConfig(locale)
  // Work week starts the day after weekend ends
  // Convert from expo-localization format (1-7) to JavaScript format (0-6)
  return weekend.end === Weekday.SUNDAY ? 1 : weekend.end % 7
}

/**
 * Check if a date falls on a weekend
 */
export const isWeekend = (date: Date, locale?: string): boolean => {
  const weekend = getWeekendConfig(locale)
  const dayOfWeek = date.getDay() + 1 // Convert to expo-localization format (1-7)

  if (weekend.start <= weekend.end) {
    // Weekend doesn't cross week boundary (e.g., Sat-Sun: 7-1 becomes 7-7 for comparison)
    if (weekend.end === Weekday.SUNDAY) {
      return dayOfWeek === weekend.start || dayOfWeek === Weekday.SUNDAY
    }
    return dayOfWeek >= weekend.start && dayOfWeek <= weekend.end
  } else {
    // Weekend crosses week boundary (e.g., Fri-Sat: 6-7)
    return dayOfWeek >= weekend.start || dayOfWeek <= weekend.end
  }
}

/**
 * Check if a date is the last day of the weekend
 */
export const isLastDayOfWeekend = (date: Date, locale?: string): boolean => {
  const weekend = getWeekendConfig(locale)
  const dayOfWeek = date.getDay() + 1 // Convert to expo-localization format (1-7)
  return dayOfWeek === weekend.end
}

/**
 * Get the name of a weekday using proper locale support
 */
export const getWeekdayName = (dayNumber: number, locale?: string): string => {
  const currentLocale = locale || getCurrentLocale()
  const date = new Date()
  // Convert from JavaScript format (0-6) to expo-localization if needed
  const jsDay = dayNumber > 7 ? dayNumber - 1 : dayNumber
  date.setDate(date.getDate() - date.getDay() + jsDay)

  try {
    return date.toLocaleDateString(currentLocale, { weekday: 'long' })
  } catch {
    // Fallback to English names
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]
    return days[jsDay] || 'Sunday'
  }
}

/**
 * Calculate the next occurrence of a specific weekday
 */
export const getNextWeekday = (
  targetDay: number,
  fromDate: Date = new Date(),
): Date => {
  const result = new Date(fromDate)
  const currentDay = result.getDay()
  const daysUntil = (targetDay - currentDay + 7) % 7

  // If it's the same day, go to next week
  const daysToAdd = daysUntil === 0 ? 7 : daysUntil

  result.setDate(result.getDate() + daysToAdd)
  result.setHours(
    DEFAULT_MORNING_HOUR,
    DEFAULT_MORNING_MINUTE,
    DEFAULT_MORNING_SECOND,
    0,
  )
  return result
}

/**
 * Calculate the next weekend start
 */
export const getNextWeekendStart = (
  fromDate: Date = new Date(),
  locale?: string,
): Date => {
  const weekend = getWeekendConfig(locale)
  // Convert from expo-localization format (1-7) to JavaScript format (0-6)
  const jsWeekendStart =
    weekend.start === Weekday.SUNDAY ? 0 : weekend.start - 1
  return getNextWeekday(jsWeekendStart, fromDate)
}

/**
 * Get random "Whenever" label
 */
const WHENEVER_LABELS = [
  'Whenever',
  'Some day',
  'No idea',
  "Future Me'll Handle It",
  'Hibernate',
  'Not Today, Thanks',
]

export const getRandomWheneverLabel = (): string => {
  const randomIndex = Math.floor(Math.random() * WHENEVER_LABELS.length)
  return WHENEVER_LABELS[randomIndex]
}

/**
 * Generate snooze option labels based on current date and locale
 */
export const getSnoozeOptions = (locale?: string) => {
  const now = new Date()
  const currentLocale = locale || getCurrentLocale()
  const _weekend = getWeekendConfig(currentLocale)
  const firstWorkday = getFirstWorkday(currentLocale)
  const firstWorkdayName = getWeekdayName(firstWorkday, currentLocale)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isCurrentlyWeekend = isWeekend(now, currentLocale)
  const isLastWeekendDay = isLastDayOfWeekend(now, currentLocale)

  // Calculate dates for display
  const weekendStart = getNextWeekendStart(now, currentLocale)
  const nextWorkday = isLastWeekendDay
    ? getNextWeekday(
        firstWorkday,
        new Date(now.getTime() + 8 * MILLISECONDS_PER_DAY),
      )
    : getNextWeekday(firstWorkday, now)

  const isWorkdayFarAway =
    nextWorkday.getTime() - now.getTime() > 7 * MILLISECONDS_PER_DAY

  return [
    {
      duration: SnoozeDuration.TOMORROW,
      label: 'Tomorrow',
      icon: 'sunny-outline',
      description: `Tomorrow at 9 AM`,
      date: tomorrow,
    },
    {
      duration: SnoozeDuration.THIS_WEEKEND,
      label: isCurrentlyWeekend ? 'Next Weekend' : 'This Weekend',
      icon: 'calendar-outline',
      description: `${weekendStart.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' })} at 9 AM`,
      date: weekendStart,
    },
    {
      duration: SnoozeDuration.NEXT_WORKDAY,
      label:
        isCurrentlyWeekend && !isLastWeekendDay
          ? `Coming ${firstWorkdayName}`
          : isWorkdayFarAway
            ? `Next ${firstWorkdayName}`
            : firstWorkdayName,
      icon: 'briefcase-outline',
      description: `${nextWorkday.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' })} at 9 AM`,
      date: nextWorkday,
    },
    {
      duration: SnoozeDuration.WHENEVER,
      label: getRandomWheneverLabel(),
      icon: 'infinite-outline',
      description: 'No specific date',
      date: undefined,
    },
  ]
}

/**
 * Gets the last day of the month for a given date
 */
export const getLastDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}
