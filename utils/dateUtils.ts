/**
 * Utility functions for consistent date handling across the app
 */

import { SnoozeDuration } from '../types/Task';

/**
 * Safely parses a date field from stored data
 * Handles both string dates and undefined values
 */
export const parseDateField = (dateValue: any): Date | undefined => {
  if (!dateValue) {
    return undefined;
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  
  return undefined;
};

/**
 * Safely parses a required date field from stored data
 * Returns current date if parsing fails
 */
export const parseRequiredDateField = (dateValue: any): Date => {
  const parsed = parseDateField(dateValue);
  return parsed || new Date();
};

/**
 * Weekend configuration by locale
 */
export interface WeekendConfig {
  start: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  end: number;
}

/**
 * Get weekend configuration for a locale
 * Default to Saturday-Sunday (US style) if locale not recognized
 */
export const getWeekendConfig = (locale?: string): WeekendConfig => {
  // Normalize locale
  const normalizedLocale = locale?.toLowerCase() || 'en-us';
  
  // Israel: Friday-Saturday weekend
  if (normalizedLocale.includes('il') || normalizedLocale.includes('he')) {
    return { start: 5, end: 6 }; // Friday-Saturday
  }
  
  // Most other countries: Saturday-Sunday weekend
  return { start: 6, end: 0 }; // Saturday-Sunday
};

/**
 * Get the first day of the work week for a locale
 */
export const getFirstWorkday = (locale?: string): number => {
  const weekend = getWeekendConfig(locale);
  // Work week starts the day after weekend ends
  return (weekend.end + 1) % 7;
};

/**
 * Check if a date falls on a weekend
 */
export const isWeekend = (date: Date, locale?: string): boolean => {
  const weekend = getWeekendConfig(locale);
  const dayOfWeek = date.getDay();
  
  if (weekend.start <= weekend.end) {
    // Weekend doesn't cross week boundary (e.g., Sat-Sun: 6-0 becomes 6-7)
    return dayOfWeek >= weekend.start && dayOfWeek <= weekend.end;
  } else {
    // Weekend crosses week boundary (e.g., Fri-Sat: 5-6)
    return dayOfWeek >= weekend.start || dayOfWeek <= weekend.end;
  }
};

/**
 * Check if a date is the last day of the weekend
 */
export const isLastDayOfWeekend = (date: Date, locale?: string): boolean => {
  const weekend = getWeekendConfig(locale);
  return date.getDay() === weekend.end;
};

/**
 * Get the name of a weekday
 */
export const getWeekdayName = (dayNumber: number, locale?: string): string => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + dayNumber);
  
  try {
    return date.toLocaleDateString(locale || 'en-US', { weekday: 'long' });
  } catch {
    // Fallback to English names
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Sunday';
  }
};

/**
 * Calculate the next occurrence of a specific weekday
 */
export const getNextWeekday = (targetDay: number, fromDate: Date = new Date()): Date => {
  const result = new Date(fromDate);
  const currentDay = result.getDay();
  const daysUntil = (targetDay - currentDay + 7) % 7;
  
  // If it's the same day, go to next week
  const daysToAdd = daysUntil === 0 ? 7 : daysUntil;
  
  result.setDate(result.getDate() + daysToAdd);
  result.setHours(9, 0, 0, 0); // Set to 9 AM
  return result;
};

/**
 * Calculate the next weekend start
 */
export const getNextWeekendStart = (fromDate: Date = new Date(), locale?: string): Date => {
  const weekend = getWeekendConfig(locale);
  return getNextWeekday(weekend.start, fromDate);
};

/**
 * Get random "Whenever" label
 */
const WHENEVER_LABELS = [
  "Whenever",
  "Some day", 
  "No idea",
  "Future Me'll Handle It",
  "Hibernate",
  "Not Today, Thanks"
];

export const getRandomWheneverLabel = (): string => {
  const randomIndex = Math.floor(Math.random() * WHENEVER_LABELS.length);
  return WHENEVER_LABELS[randomIndex];
};

/**
 * Generate snooze option labels based on current date and locale
 */
export const getSnoozeOptions = (locale?: string) => {
  const now = new Date();
  const currentLocale = locale || 'en-US';
  const weekend = getWeekendConfig(currentLocale);
  const firstWorkday = getFirstWorkday(currentLocale);
  const firstWorkdayName = getWeekdayName(firstWorkday, currentLocale);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isCurrentlyWeekend = isWeekend(now, currentLocale);
  const isLastWeekendDay = isLastDayOfWeekend(now, currentLocale);
  
  // Calculate dates for display
  const weekendStart = getNextWeekendStart(now, currentLocale);
  const nextWorkday = isLastWeekendDay 
    ? getNextWeekday(firstWorkday, new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000))
    : getNextWeekday(firstWorkday, now);
    
  const isWorkdayFarAway = nextWorkday.getTime() - now.getTime() > 7 * 24 * 60 * 60 * 1000;
  
  return [
    {
      duration: 'tomorrow' as SnoozeDuration,
      label: 'Tomorrow',
      icon: 'sunny-outline',
      description: `Tomorrow at 9 AM`,
      date: tomorrow
    },
    {
      duration: 'this-weekend' as SnoozeDuration,
      label: isCurrentlyWeekend ? 'Next Weekend' : 'This Weekend',
      icon: 'calendar-outline', 
      description: `${weekendStart.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' })} at 9 AM`,
      date: weekendStart
    },
    {
      duration: 'next-workday' as SnoozeDuration,
      label: isCurrentlyWeekend && !isLastWeekendDay 
        ? `Coming ${firstWorkdayName}`
        : isWorkdayFarAway 
          ? `Next ${firstWorkdayName}` 
          : firstWorkdayName,
      icon: 'briefcase-outline',
      description: `${nextWorkday.toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' })} at 9 AM`,
      date: nextWorkday
    },
    {
      duration: 'whenever' as SnoozeDuration,
      label: getRandomWheneverLabel(),
      icon: 'infinite-outline',
      description: 'No specific date',
      date: undefined
    }
  ];
};