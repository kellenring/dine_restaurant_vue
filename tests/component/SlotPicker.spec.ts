// 第 2 層：元件測試 —— 只給 props，檢查畫面；不打 API
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import SlotPicker, { type SlotInfo } from '@/components/SlotPicker.vue';
import { SLOTS } from '@/rules';
import { installQuasarPlugin } from '../helpers/installQuasarPlugin';

installQuasarPlugin();

// 與 Postman「Get availability / 200 成功」範例相同的名額
const availability: SlotInfo[] = [
  { slot: '11:30', remaining: 20 },
  { slot: '12:30', remaining: 5 },
  { slot: '17:30', remaining: 0 },
  { slot: '18:30', remaining: 20 },
];

describe('SlotPicker（BR-05、BR-12）', () => {
  it('TC-05-1：只顯示 11:30、12:30、17:30、18:30 四個時段', () => {
    render(SlotPicker, { props: { slots: availability } });
    const names = screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label')?.split(' · ')[0]);
    expect(names).toEqual([...SLOTS]);
  });

  it('TC-12-2：顯示剩餘名額 5 left', () => {
    render(SlotPicker, { props: { slots: availability } });
    expect(screen.getByRole('radio', { name: '12:30 · 5 left' })).toBeInTheDocument();
  });

  it('TC-12-1：額滿顯示 Full 且停用', () => {
    render(SlotPicker, { props: { slots: availability } });
    const full = screen.getByRole('radio', { name: '17:30 · Full' });
    // QRadio 用 aria-disabled 表示停用（不是原生 disabled），所以不能用 toBeDisabled()
    expect(full).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('radio', { name: '12:30 · 5 left' })).not.toHaveAttribute('aria-disabled');
  });

  it('還沒選日期時顯示 Pick a date，全部不能選', () => {
    render(SlotPicker, { props: { slots: SLOTS.map((slot) => ({ slot })) } });
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAccessibleName(/Pick a date$/);
      expect(radio).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('點選時段會 emit 選到的值；點額滿時段不會', async () => {
    const user = userEvent.setup();
    const { emitted } = render(SlotPicker, { props: { slots: availability, modelValue: '' } });

    await user.click(screen.getByRole('radio', { name: '17:30 · Full' }));
    expect(emitted()['update:modelValue']).toBeUndefined();

    await user.click(screen.getByRole('radio', { name: '12:30 · 5 left' }));
    expect(emitted()['update:modelValue']).toEqual([['12:30']]);
  });

  it('有 error 時顯示錯誤文字', () => {
    render(SlotPicker, { props: { slots: availability, error: 'This field is required' } });
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  describe('lifecycle：props 更新後重新渲染', () => {
    it('父元件傳入新的名額，畫面要 await 之後才會更新', async () => {
      const { rerender } = render(SlotPicker, { props: { slots: availability } });
      expect(screen.getByRole('radio', { name: '12:30 · 5 left' })).toBeInTheDocument();

      const updated = availability.map((s) => (s.slot === '12:30' ? { ...s, remaining: 0 } : s));
      const pending = rerender({ slots: updated });

      // Vue 會把 DOM 更新排到下一個 microtask，還沒 await 時畫面仍是舊的
      expect(screen.getByRole('radio', { name: '12:30 · 5 left' })).toBeInTheDocument();

      await pending; // 等同 await nextTick()
      expect(screen.getByRole('radio', { name: '12:30 · Full' })).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
