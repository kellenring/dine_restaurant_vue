import { onMounted, onUnmounted, ref } from 'vue';
import { createReservation, getAvailability, type Availability, type Reservation } from '@/api/reservations';
import { isCanceled } from '@/api/http';
import { SLOTS } from '@/rules';
import { todayInTaipei, type DateRange } from '@/utils/date';
import { apiErrorToMessages, validateBooking, type ApiError, type BookingInput, type FieldErrors } from '@/utils/validation';
import type { SlotInfo } from '@/components/SlotPicker.vue';

const emptySlots = (): SlotInfo[] => SLOTS.map((slot) => ({ slot }));

/**
 * 預約頁的資料與流程：載入名額、送出、錯誤處理（BR-04、06、07、12）。
 * 必須在元件 setup() 內呼叫，因為用到 onMounted / onUnmounted。
 */
export function useBooking() {
  const range = ref<DateRange | null>(null);
  const slots = ref<SlotInfo[]>(emptySlots());
  const fieldErrors = ref<FieldErrors>({});
  const formError = ref('');
  const submitting = ref(false);
  const confirmed = ref<Reservation | null>(null);

  // 卸載時取消還在等待的請求，避免元件不在了還去更新狀態
  const controller = new AbortController();
  let latestDate = '';

  async function fetchAvailability(date: string): Promise<Availability | null> {
    try {
      return await getAvailability(date, controller.signal);
    } catch (err) {
      if (!isCanceled(err)) formError.value = apiErrorToMessages(err as ApiError).form;
      return null;
    }
  }

  /** 選日期後更新各時段剩餘名額（BR-12） */
  async function loadSlots(date: string) {
    latestDate = date;
    if (!date) {
      slots.value = emptySlots();
      return;
    }
    const data = await fetchAvailability(date);
    if (data && date === latestDate) slots.value = data.slots; // 連續切換日期時，只採用最後一次的結果
  }

  async function submit(input: BookingInput): Promise<boolean> {
    if (submitting.value) return false; // TC-07-2：送出中再按不會重送

    formError.value = '';
    fieldErrors.value = validateBooking(input, range.value);
    if (Object.keys(fieldErrors.value).length) return false; // TC-01-1：前端擋下時不送 API

    submitting.value = true;
    try {
      confirmed.value = await createReservation({ ...input, name: input.name.trim(), phone: input.phone.trim() }, controller.signal);
      return true;
    } catch (err) {
      if (isCanceled(err)) return false;
      const apiError = err as ApiError;
      const messages = apiErrorToMessages(apiError);
      fieldErrors.value = messages.fields;
      formError.value = messages.form;
      if (apiError.error === 'SLOT_FULL') await loadSlots(input.date); // BR-06：重新抓名額，畫面顯示最新剩餘數
      return false;
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    confirmed.value = null;
    fieldErrors.value = {};
    formError.value = '';
    slots.value = emptySlots();
  }

  // 掛載時取得可預約範圍（BR-04，以後端回傳為準）
  onMounted(async () => {
    const data = await fetchAvailability(todayInTaipei());
    if (data) range.value = data.range;
  });

  onUnmounted(() => controller.abort());

  return { range, slots, fieldErrors, formError, submitting, confirmed, loadSlots, submit, reset };
}
