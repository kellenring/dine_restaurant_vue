// 第 1 層：函式測試 —— 用假時間固定「現在」，測試不會隨執行日期失效
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addDays, bookingRange, todayInTaipei } from '@/utils/date';

describe('addDays', () => {
  it('跨月、跨年都正確', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-11', 30)).toBe('2026-12-11');
  });
});

describe('bookingRange（BR-04，台灣時間）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TC-04-1：min = D+1、max = D+30', () => {
    vi.setSystemTime(new Date('2026-11-11T04:00:00Z')); // 台北 11/11 12:00
    expect(bookingRange()).toEqual({ min: '2026-11-12', max: '2026-12-11' });
  });

  it('台北已過午夜、UTC 還是前一天時，以台北日期為準', () => {
    vi.setSystemTime(new Date('2026-11-10T16:30:00Z')); // 台北 11/11 00:30
    expect(todayInTaipei()).toBe('2026-11-11');
    expect(bookingRange()).toEqual({ min: '2026-11-12', max: '2026-12-11' });

    // 對照：用 UTC 計算會差一天，min 會變成「今天」，手動測試幾乎不會在這個時段發現
    const utcToday = new Date().toISOString().slice(0, 10);
    expect(utcToday).toBe('2026-11-10');
  });

  it('台北 23:59:59 與 00:00:00 的邊界', () => {
    vi.setSystemTime(new Date('2026-11-10T15:59:59Z')); // 台北 11/10 23:59:59
    expect(bookingRange().min).toBe('2026-11-11');

    vi.setSystemTime(new Date('2026-11-10T16:00:00Z')); // 台北 11/11 00:00:00
    expect(bookingRange().min).toBe('2026-11-12');
  });
});
