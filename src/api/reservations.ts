import { http } from './http';
import type { DateRange } from '@/utils/date';
import type { BookingInput } from '@/utils/validation';
import type { SlotInfo } from '@/components/SlotPicker.vue';

export type Availability = { date: string; range: DateRange; maxGuests: number; slots: Required<SlotInfo>[] };
export type Reservation = BookingInput & { id: number };

/** GET /api/availability?date=YYYY-MM-DD（BR-04、BR-12） */
export async function getAvailability(date: string, signal?: AbortSignal): Promise<Availability> {
  const { data } = await http.get<Availability>('/api/availability', { params: { date }, signal });
  return data;
}

/** POST /api/reservations（BR-01~08） */
export async function createReservation(body: BookingInput, signal?: AbortSignal): Promise<Reservation> {
  const { data } = await http.post<Reservation>('/api/reservations', body, { signal });
  return data;
}
