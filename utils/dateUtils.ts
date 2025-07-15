/**
 * Utility functions for consistent date handling across the app
 */

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