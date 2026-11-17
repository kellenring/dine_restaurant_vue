<script setup lang="ts">
import BookingForm from './components/BookingForm.vue';
import MockBanner from './components/MockBanner.vue';

const mockApi = import.meta.env.VITE_USE_MOCK !== 'false';
</script>

<template>
  <MockBanner v-if="mockApi" />
  <main class="q-pa-md" style="max-width: 560px; margin: 0 auto">
    <h1 class="text-h4 q-mb-lg">Reservations</h1>
    <BookingForm />
  </main>
</template>
