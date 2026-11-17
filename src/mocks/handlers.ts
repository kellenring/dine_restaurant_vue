import { http, HttpResponse } from 'msw';
import { example } from './fixtures';
import { bookingRange } from '@/utils/date';
import type { Availability, Reservation } from '@/api/reservations';
import type { ApiError, BookingInput } from '@/utils/validation';

export const fixtures = {
  availability: example<Availability>('Get availability', '200 成功'),
  availabilityInvalid: example<ApiError>('Get availability', '400 日期格式錯誤'),
  created: example<Reservation>('Create reservation', '201 成功'),
  validationError: example<ApiError>('Create reservation', '400 欄位錯誤'),
  slotFull: example<ApiError>('Create reservation', '409 名額不足'),
  duplicate: example<ApiError>('Create reservation', '409 重複訂位'),
};

const reply = <T>(f: { status: number; body: T }) => HttpResponse.json(f.body as object, { status: f.status });

/**
 * 預設情境：所有請求都成功。
 * Node（Vitest，見 server.ts）和瀏覽器（npm run dev，見 browser.ts）共用這一份。
 */
export const handlers = [
  http.get('/api/availability', ({ request }) => {
    const date = new URL(request.url).searchParams.get('date') ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply(fixtures.availabilityInvalid);
    // 名額沿用 Postman 範例；日期與可預約範圍依「現在」換算，畫面才不會隨時間失效
    return HttpResponse.json({ ...fixtures.availability.body, date, range: bookingRange() });
  }),

  http.post('/api/reservations', async ({ request }) => {
    const body = (await request.json()) as BookingInput;
    return HttpResponse.json({ ...fixtures.created.body, ...body }, { status: fixtures.created.status });
  }),
];

/** 個別測試用 server.use(...) 覆寫的錯誤情境 */
export const scenarios = {
  slotFull: () => http.post('/api/reservations', () => reply(fixtures.slotFull)),
  duplicate: () => http.post('/api/reservations', () => reply(fixtures.duplicate)),
  validationError: () => http.post('/api/reservations', () => reply(fixtures.validationError)),
  networkError: () => http.post('/api/reservations', () => HttpResponse.error()),
};
