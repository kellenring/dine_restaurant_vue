<script setup lang="ts">
// BR-03：人數 1–10，到邊界停用按鈕
import { MAX_GUESTS } from '@/rules';

const model = defineModel<number>({ required: true });
</script>

<template>
  <div class="guest-counter">
    <div id="guests-label" class="text-subtitle2">Guests</div>
    <div class="row items-center q-gutter-sm" role="group" aria-labelledby="guests-label">
      <q-btn
        round
        outline
        color="primary"
        icon="remove"
        aria-label="Decrease guests"
        :disable="model <= 1"
        @click="model = model - 1"
      />
      <output class="text-h6 guest-counter__value" aria-live="polite">{{ model }}</output>
      <q-btn
        round
        outline
        color="primary"
        icon="add"
        aria-label="Increase guests"
        :disable="model >= MAX_GUESTS"
        @click="model = model + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.guest-counter__value {
  min-width: 2ch;
  text-align: center;
}
</style>
