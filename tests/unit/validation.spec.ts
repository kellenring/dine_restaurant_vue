// 第 1 層：函式測試 —— 純函式，不掛元件、不打 API，毫秒級
import { describe, expect, it } from 'vitest';
import { apiErrorToMessages, isValidPhone, validateBooking, type BookingInput } from '@/utils/validation';
import { MSG } from '@/messages';

const valid: BookingInput = { name: 'Amy', phone: '0912345678', date: '2026-11-14', slot: '12:30', guests: 2 };
const range = { min: '2026-11-12', max: '2026-12-11' };

describe('isValidPhone（BR-02）', () => {
  it('09 開頭 10 碼數字是合法電話', () => {
    expect(isValidPhone('0912345678')).toBe(true);
  });

  // TC-02-1：規格書指定的兩個錯誤值，用 it.each 各跑一次
  it.each([
    ['0812345678', '不是 09 開頭'],
    ['091234567', '只有 9 碼'],
    ['09123456789', '11 碼'],
    ['09a2345678', '含非數字'],
  ])('TC-02-1：%s 不合法（%s）', (phone) => {
    expect(isValidPhone(phone)).toBe(false);
  });
});

describe('validateBooking（BR-01、02、04）', () => {
  it('全部填寫正確時沒有錯誤', () => {
    expect(validateBooking(valid, range)).toEqual({});
  });

  it('TC-01-1：四個欄位空白都回 This field is required（人數預設為 1 不檢查）', () => {
    const errors = validateBooking({ name: '', phone: '', date: '', slot: '', guests: 1 }, range);
    expect(errors).toEqual({
      name: MSG.REQUIRED,
      phone: MSG.REQUIRED,
      date: MSG.REQUIRED,
      slot: MSG.REQUIRED,
    });
  });

  it('只有空白的姓名視為未填', () => {
    expect(validateBooking({ ...valid, name: '   ' }, range).name).toBe(MSG.REQUIRED);
  });

  it('TC-02-1：電話格式錯誤顯示 Please enter a valid phone number', () => {
    expect(validateBooking({ ...valid, phone: '0812345678' }, range)).toEqual({ phone: MSG.INVALID_PHONE });
  });

  it.each([
    ['2026-11-11', '今天（D）不開放'],
    ['2026-12-12', 'D+31 超出範圍'],
  ])('BR-04：%s 超出可預約範圍（%s）', (date) => {
    expect(validateBooking({ ...valid, date }, range).date).toBe(MSG.OUT_OF_RANGE_DATE);
  });

  it.each([range.min, range.max])('BR-04：邊界值 %s 可以預約', (date) => {
    expect(validateBooking({ ...valid, date }, range).date).toBeUndefined();
  });

  it('還沒拿到可預約範圍時，不擋日期', () => {
    expect(validateBooking({ ...valid, date: '2020-01-01' }, null)).toEqual({});
  });
});

describe('apiErrorToMessages（後端錯誤碼 → 畫面文案）', () => {
  it('BR-06：409 SLOT_FULL 顯示剩餘名額', () => {
    expect(apiErrorToMessages({ status: 409, error: 'SLOT_FULL', remaining: 5 })).toEqual({
      fields: {},
      form: 'Only 5 seats left for this time',
    });
  });

  it('BR-07：409 DUPLICATE 顯示重複預約文案', () => {
    expect(apiErrorToMessages({ status: 409, error: 'DUPLICATE' }).form).toBe(MSG.DUPLICATE);
  });

  it('400 VALIDATION_ERROR：欄位錯誤放到欄位下方，guests 沒有欄位就放表單層級', () => {
    const result = apiErrorToMessages({
      status: 400,
      error: 'VALIDATION_ERROR',
      fields: { name: 'REQUIRED', phone: 'INVALID_PHONE', date: 'OUT_OF_RANGE', guests: 'OUT_OF_RANGE' },
    });
    expect(result).toEqual({
      fields: { name: MSG.REQUIRED, phone: MSG.INVALID_PHONE, date: MSG.OUT_OF_RANGE_DATE },
      form: MSG.GENERIC,
    });
  });

  it('未知錯誤或網路錯誤顯示通用文案', () => {
    expect(apiErrorToMessages({ status: 0, error: 'NETWORK_ERROR' }).form).toBe(MSG.GENERIC);
  });
});
