<script setup lang="ts">
import { reactive, watch } from 'vue';
import GuestCounter from './GuestCounter.vue';
import SlotPicker from './SlotPicker.vue';
import { useBooking } from '@/composables/useBooking';
import { MSG } from '@/messages';
import type { BookingInput, Field } from '@/utils/validation';

const form = reactive<BookingInput>({ name: '', phone: '', date: '', slot: '', guests: 1 });
const { range, slots, fieldErrors, formError, submitting, confirmed, loadSlots, submit, reset } = useBooking();

// 換日期 → 重新抓該日各時段名額；原本選的時段可能已不適用，先清掉
watch(
  () => form.date,
  (date) => {
    form.slot = '';
    void loadSlots(date);
  },
);

// 使用者修改欄位就清掉該欄的紅字
const clearError = (field: Field) => {
  if (fieldErrors.value[field]) fieldErrors.value = { ...fieldErrors.value, [field]: undefined };
};
watch(() => form.slot, () => clearError('slot'));

function makeAnother() {
  Object.assign(form, { name: '', phone: '', date: '', slot: '', guests: 1 });
  reset();
}
</script>

<template>
  <section v-if="confirmed" class="q-gutter-md">
    <h2 class="text-h6">{{ MSG.CONFIRMED }}</h2>
    <p>{{ confirmed.name }}, {{ confirmed.guests }} guest(s) on {{ confirmed.date }} at {{ confirmed.slot }}</p>
    <q-btn flat color="primary" label="Make another reservation" @click="makeAnother" />
  </section>

  <form v-else class="q-gutter-md" aria-label="Reservation" novalidate @submit.prevent="submit(form)">
    <!-- BR-06、BR-07：後端錯誤顯示在表單層級 -->
    <div v-if="formError" role="alert" class="text-negative">{{ formError }}</div>

    <q-input
      v-model="form.name"
      for="name"
      label="Name"
      autocomplete="name"
      outlined
      :error="!!fieldErrors.name"
      :error-message="fieldErrors.name"
      @update:model-value="clearError('name')"
    />
    <q-input
      v-model="form.phone"
      for="phone"
      label="Phone"
      type="tel"
      inputmode="numeric"
      autocomplete="tel"
      placeholder="0912345678"
      outlined
      :error="!!fieldErrors.phone"
      :error-message="fieldErrors.phone"
      @update:model-value="clearError('phone')"
    />
    <q-input
      v-model="form.date"
      for="date"
      label="Date"
      type="date"
      stack-label
      outlined
      :min="range?.min"
      :max="range?.max"
      :error="!!fieldErrors.date"
      :error-message="fieldErrors.date"
      @update:model-value="clearError('date')"
    />

    <SlotPicker v-model="form.slot" :slots="slots" :error="fieldErrors.slot" />
    <GuestCounter v-model="form.guests" />

    <q-btn type="submit" color="primary" label="MAKE RESERVATION" :disable="submitting" />
  </form>
</template>
