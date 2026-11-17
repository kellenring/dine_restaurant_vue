import { BOOKING_WINDOW_DAYS, TZ_OFFSET_HOURS } from '@/rules';

export type DateRange = { min: string; max: string };

/** 台灣時間（UTC+8）的今天，格式 YYYY-MM-DD */
export function todayInTaipei(now: Date = new Date()): string {
  return new Date(now.getTime() + TZ_OFFSET_HOURS * 3600_000).toISOString().slice(0, 10);
}

/** 日期字串加減天數，不受執行環境時區影響 */
export function addDays(date: string, days: number): string {
  const t = new Date(`${date}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

/** BR-04：可預約 D+1 ~ D+30，D 以台灣時間計算 */
export function bookingRange(now: Date = new Date()): DateRange {
  const today = todayInTaipei(now);
  return { min: addDays(today, 1), max: addDays(today, BOOKING_WINDOW_DAYS) };
}
