import {
  parseDateField,
  parseRequiredDateField,
  getWeekendConfig,
  isWeekend,
  getFirstWorkday,
  getWeekdayName,
  getNextWeekday,
  getNextWeekendStart,
  getRandomWheneverLabel,
} from '../../utils/dateUtils';
import * as Localization from 'expo-localization';

// Mock locale utils
jest.mock('../../utils/localeUtils', () => ({
  getCurrentLocale: jest.fn(() => 'en-US'),
  getCurrentRegion: jest.fn(() => 'US'),
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  Weekday: {
    SUNDAY: 1,
    MONDAY: 2,
    TUESDAY: 3,
    WEDNESDAY: 4,
    THURSDAY: 5,
    FRIDAY: 6,
    SATURDAY: 7,
  },
}));

const { getCurrentRegion } = require('../../utils/localeUtils');

describe('dateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to US region by default
    getCurrentRegion.mockReturnValue('US');
  });

  describe('parseDateField', () => {
    it('returns undefined for null or undefined', () => {
      expect(parseDateField(null)).toBeUndefined();
      expect(parseDateField(undefined)).toBeUndefined();
    });

    it('returns the same Date object if input is Date', () => {
      const date = new Date('2024-01-01');
      expect(parseDateField(date)).toBe(date);
    });

    it('parses valid date strings', () => {
      const result = parseDateField('2024-01-01T00:00:00.000Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('parses valid timestamps', () => {
      const timestamp = 1704067200000; // 2024-01-01 00:00:00 UTC
      const result = parseDateField(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(timestamp);
    });

    it('returns undefined for invalid inputs', () => {
      expect(parseDateField('invalid-date')).toBeUndefined();
      expect(parseDateField({})).toBeUndefined();
      expect(parseDateField([])).toBeUndefined();
      expect(parseDateField(true)).toBeUndefined();
    });
  });

  describe('parseRequiredDateField', () => {
    it('returns current date for invalid input', () => {
      const before = Date.now();
      const result = parseRequiredDateField('invalid-date');
      const after = Date.now();
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    it('parses valid dates normally', () => {
      const result = parseRequiredDateField('2024-01-01T00:00:00.000Z');
      expect(result.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('getWeekendConfig', () => {
    it('returns Saturday-Sunday for US region', () => {
      getCurrentRegion.mockReturnValue('US');
      const config = getWeekendConfig();
      expect(config).toEqual({ 
        start: Localization.Weekday.SATURDAY, 
        end: Localization.Weekday.SUNDAY 
      });
    });

    it('returns Friday-Saturday for Israel', () => {
      getCurrentRegion.mockReturnValue('IL');
      const config = getWeekendConfig();
      expect(config).toEqual({ 
        start: Localization.Weekday.FRIDAY, 
        end: Localization.Weekday.SATURDAY 
      });
    });

    it('returns Friday-Saturday for Middle Eastern countries', () => {
      const middleEasternCountries = ['SA', 'AE', 'BH', 'KW', 'QA'];
      
      middleEasternCountries.forEach(country => {
        getCurrentRegion.mockReturnValue(country);
        const config = getWeekendConfig();
        expect(config).toEqual({ 
          start: Localization.Weekday.FRIDAY, 
          end: Localization.Weekday.SATURDAY 
        });
      });
    });

    it('returns default weekend for other countries', () => {
      // Countries not in the specific lists get Saturday-Sunday
      const otherCountries = ['IR', 'OM', 'JO', 'EG', 'YE', 'FR', 'DE', 'JP'];
      
      otherCountries.forEach(country => {
        getCurrentRegion.mockReturnValue(country);
        const config = getWeekendConfig();
        expect(config).toEqual({ 
          start: Localization.Weekday.SATURDAY, 
          end: Localization.Weekday.SUNDAY 
        });
      });
    });
  });

  describe('isWeekend', () => {
    it('correctly identifies weekends for US region', () => {
      getCurrentRegion.mockReturnValue('US');
      
      // Test each day of the week starting from Sunday (2024-01-07)
      expect(isWeekend(new Date('2024-01-07'))).toBe(true);  // Sunday
      expect(isWeekend(new Date('2024-01-08'))).toBe(false); // Monday
      expect(isWeekend(new Date('2024-01-09'))).toBe(false); // Tuesday
      expect(isWeekend(new Date('2024-01-10'))).toBe(false); // Wednesday
      expect(isWeekend(new Date('2024-01-11'))).toBe(false); // Thursday
      expect(isWeekend(new Date('2024-01-12'))).toBe(false); // Friday
      expect(isWeekend(new Date('2024-01-13'))).toBe(true);  // Saturday
    });

    it('correctly identifies weekends for Israel', () => {
      getCurrentRegion.mockReturnValue('IL');
      
      expect(isWeekend(new Date('2024-01-07'))).toBe(false); // Sunday
      expect(isWeekend(new Date('2024-01-12'))).toBe(true);  // Friday
      expect(isWeekend(new Date('2024-01-13'))).toBe(true);  // Saturday
    });
  });

  describe('getFirstWorkday', () => {
    it('returns Monday for US region', () => {
      getCurrentRegion.mockReturnValue('US');
      // In JavaScript Date format: 0 = Sunday, 1 = Monday, etc.
      expect(getFirstWorkday()).toBe(1); // Monday
    });

    it('returns Sunday for Israel', () => {
      getCurrentRegion.mockReturnValue('IL');
      expect(getFirstWorkday()).toBe(0); // Sunday
    });

    it('returns Monday for countries with default weekend', () => {
      // Countries with Saturday-Sunday weekend have Monday as first workday
      getCurrentRegion.mockReturnValue('IR');
      expect(getFirstWorkday()).toBe(1); // Monday
    });
  });

  describe('getWeekdayName', () => {
    it('returns correct weekday names', () => {
      // getWeekdayName expects JavaScript day format (0-6)
      expect(getWeekdayName(0)).toContain('Sunday');
      expect(getWeekdayName(1)).toContain('Monday');
      expect(getWeekdayName(2)).toContain('Tuesday');
      expect(getWeekdayName(3)).toContain('Wednesday');
      expect(getWeekdayName(4)).toContain('Thursday');
      expect(getWeekdayName(5)).toContain('Friday');
      expect(getWeekdayName(6)).toContain('Saturday');
    });

    it('handles invalid day numbers', () => {
      // Invalid day numbers still return a day name based on modulo operation
      const result = getWeekdayName(-1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getNextWeekday', () => {
    it('returns next occurrence of target weekday', () => {
      const monday = new Date('2024-01-15'); // Monday
      // getNextWeekday expects JavaScript format (0-6), not expo format
      const result = getNextWeekday(5, monday); // 5 = Friday in JS format
      
      expect(result.getDay()).toBe(5); // Friday (0-based, where Sunday is 0)
      expect(result.getDate()).toBe(19); // Jan 19, 2024
    });

    it('returns next week if target day is today', () => {
      const friday = new Date('2024-01-19'); // Friday
      const result = getNextWeekday(5, friday); // 5 = Friday in JS format
      
      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(26); // Next Friday
    });
  });

  describe('getNextWeekendStart', () => {
    it('returns Saturday for US region', () => {
      getCurrentRegion.mockReturnValue('US');
      const monday = new Date('2024-01-15'); // Monday
      const result = getNextWeekendStart(monday);
      
      expect(result.getDay()).toBe(6); // Saturday
      expect(result.getDate()).toBe(20); // Jan 20, 2024
    });

    it('returns Friday for Israel', () => {
      getCurrentRegion.mockReturnValue('IL');
      const sunday = new Date('2024-01-14'); // Sunday
      const result = getNextWeekendStart(sunday);
      
      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(19); // Jan 19, 2024
    });
  });

  describe('getRandomWheneverLabel', () => {
    it('returns a string', () => {
      const result = getRandomWheneverLabel();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns one of the expected labels', () => {
      const expectedLabels = [
        "Whenever",
        "Some day", 
        "No idea",
        "Future Me'll Handle It",
        "Hibernate",
        "Not Today, Thanks"
      ];
      
      // Test multiple times to ensure randomness works
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const result = getRandomWheneverLabel();
        results.add(result);
        expect(expectedLabels).toContain(result);
      }
      
      // Should get at least 2 different results in 20 tries
      expect(results.size).toBeGreaterThanOrEqual(2);
    });
  });
});