export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface HolidayItem {
  date: string; // e.g., '01/01', '1405/01/01'
  title: string;
  isReligious?: boolean;
}

export type CalendarPreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export interface CalendarFormatOptions {
  includeDayName?: boolean;
  persianDigits?: boolean;
  format?: 'short' | 'medium' | 'long' | 'full';
}
