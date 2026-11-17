import { PHONE_PATTERN } from '@/rules';
import { MSG } from '@/messages';
import type { DateRange } from './date';

export type BookingInput = { name: string; phone: string; date: string; slot: string; guests: number };
export type Field = 'name' | 'phone' | 'date' | 'slot';
export type FieldErrors = Partial<Record<Field, string>>;

/** 後端錯誤回應（經 api/http.ts 的 interceptor 整理） */
export type ApiError = {
  status: number;
  error: string;
  remaining?: number;
  fields?: Record<string, string>;
};

const FORM_FIELDS: readonly Field[] = ['name', 'phone', 'date', 'slot'];

/** BR-02：09 開頭共 10 碼數字 */
export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone);
}

/** 前端提前檢查（BR-01、02、04）；規則以後端為準（BR-08），這裡只為了體驗 */
export function validateBooking(v: BookingInput, range?: DateRange | null): FieldErrors {
  const e: FieldErrors = {};
  if (!v.name.trim()) e.name = MSG.REQUIRED;
  if (!v.phone.trim()) e.phone = MSG.REQUIRED;
  else if (!isValidPhone(v.phone.trim())) e.phone = MSG.INVALID_PHONE;
  if (!v.date) e.date = MSG.REQUIRED;
  else if (range && (v.date < range.min || v.date > range.max)) e.date = MSG.OUT_OF_RANGE_DATE;
  if (!v.slot) e.slot = MSG.REQUIRED;
  return e;
}

/** 把後端錯誤碼轉成畫面文案：欄位錯誤顯示在欄位下方，其他顯示在表單層級 */
export function apiErrorToMessages(err: ApiError): { fields: FieldErrors; form: string } {
  if (err.error === 'SLOT_FULL') return { fields: {}, form: MSG.slotFull(err.remaining ?? 0) };
  if (err.error === 'DUPLICATE') return { fields: {}, form: MSG.DUPLICATE };
  if (err.error !== 'VALIDATION_ERROR') return { fields: {}, form: MSG.GENERIC };

  const fields: FieldErrors = {};
  let form = '';
  for (const [field, code] of Object.entries(err.fields ?? {})) {
    const msg =
      code === 'REQUIRED' ? MSG.REQUIRED
      : field === 'phone' ? MSG.INVALID_PHONE
      : field === 'date' ? MSG.OUT_OF_RANGE_DATE
      : MSG.GENERIC;
    if ((FORM_FIELDS as readonly string[]).includes(field)) fields[field as Field] = msg;
    else form = msg; // 例如 guests：畫面上沒有對應的錯誤欄位
  }
  return { fields, form };
}
