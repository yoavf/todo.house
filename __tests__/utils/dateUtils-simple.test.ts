import { parseDateField, parseRequiredDateField } from '../../utils/dateUtils'

// Mock locale utils since we can't import expo-localization easily in tests
jest.mock('../../utils/localeUtils', () => ({
  getCurrentLocale: jest.fn(() => 'en-US'),
  getCurrentRegion: jest.fn(() => 'US'),
}))

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
}))

describe('dateUtils', () => {
  describe('parseDateField', () => {
    it('should return undefined for null or undefined input', () => {
      expect(parseDateField(null)).toBeUndefined()
      expect(parseDateField(undefined)).toBeUndefined()
    })

    it('should return the same Date object if input is already a Date', () => {
      const date = new Date('2024-01-01')
      expect(parseDateField(date)).toBe(date)
    })

    it('should parse valid date strings', () => {
      const result = parseDateField('2024-01-01T00:00:00.000Z')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
    })

    it('should parse valid timestamps', () => {
      const timestamp = Date.now()
      const result = parseDateField(timestamp)
      expect(result).toBeInstanceOf(Date)
      expect(result?.getTime()).toBe(timestamp)
    })

    it('should return undefined for invalid date strings', () => {
      expect(parseDateField('invalid-date')).toBeUndefined()
    })
  })

  describe('parseRequiredDateField', () => {
    it('should return current date for invalid input', () => {
      const result = parseRequiredDateField('invalid-date')
      expect(result).toBeInstanceOf(Date)
      // Should be recent (within last few seconds)
      expect(Date.now() - result.getTime()).toBeLessThan(1000)
    })

    it('should parse valid dates normally', () => {
      const result = parseRequiredDateField('2024-01-01T00:00:00.000Z')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
    })
  })
})
