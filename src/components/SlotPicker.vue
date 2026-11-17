<script setup lang="ts">
// BR-05：只有四個時段；BR-12：顯示剩餘名額，額滿顯示 Full 並停用
import { MSG } from '@/messages';

export type SlotInfo = { slot: string; remaining?: number };

defineProps<{ slots: SlotInfo[]; error?: string }>();
const model = defineModel<string>({ default: '' });

const isFull = (s: SlotInfo) => s.remaining !== undefined && s.remaining <= 0;
// 還沒選日期（remaining 未知）或額滿都不能選
const isDisabled = (s: SlotInfo) => s.remaining === undefined || isFull(s);
const statusText = (s: SlotInfo) =>
  s.remaining === undefined ? MSG.PICK_DATE : isFull(s) ? MSG.FULL : MSG.slotLeft(s.remaining);
</script>

<template>
  <fieldset class="slot-picker">
    <legend class="text-subtitle2">Time</legend>
    <div class="row q-gutter-md">
      <q-radio
        v-for="s in slots"
        :key="s.slot"
        v-model="model"
        :val="s.slot"
        :label="`${s.slot} · ${statusText(s)}`"
        :disable="isDisabled(s)"
      />
    </div>
    <div v-if="error" class="text-negative text-caption q-mt-xs">{{ error }}</div>
  </fieldset>
</template>

<style scoped>
.slot-picker {
  border: 0;
  padding: 0;
  margin: 0;
}
</style>
