// 第 2 層：元件測試 —— 一次掛一個元件，props 進、emit 出，不需要 mock API
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import GuestCounter from '@/components/GuestCounter.vue';
import { installQuasarPlugin } from '../helpers/installQuasarPlugin';

installQuasarPlugin();

/** 模擬父元件用 v-model 綁定，這樣按 + / − 後畫面上的數字才會真的改變 */
function renderWithVModel(initial: number) {
  const Host = defineComponent(() => {
    const guests = ref(initial);
    return () => h(GuestCounter, { modelValue: guests.value, 'onUpdate:modelValue': (v: number) => (guests.value = v) });
  });
  return render(Host);
}

const minus = () => screen.getByRole('button', { name: 'Decrease guests' });
const plus = () => screen.getByRole('button', { name: 'Increase guests' });
const value = () => screen.getByRole('status'); // <output> 的隱含 role 是 status

describe('GuestCounter（BR-03）', () => {
  it('TC-03-1：人數為 1 時 − 按鈕停用，+ 可以按', () => {
    render(GuestCounter, { props: { modelValue: 1 } });
    expect(minus()).toBeDisabled();
    expect(plus()).toBeEnabled();
  });

  it('TC-03-2：按 + 直到 10，人數停在 10 且 + 停用', async () => {
    const user = userEvent.setup();
    renderWithVModel(1);

    for (let i = 0; i < 12; i++) await user.click(plus()); // 多按兩次也不會超過 10

    expect(value()).toHaveTextContent('10');
    expect(plus()).toBeDisabled();
    expect(minus()).toBeEnabled();
  });

  it('按 − 會減少人數', async () => {
    const user = userEvent.setup();
    renderWithVModel(3);
    await user.click(minus());
    expect(value()).toHaveTextContent('2');
  });

  describe('lifecycle：emit', () => {
    it('按 + 時 emit update:modelValue，值為目前人數 + 1', async () => {
      const user = userEvent.setup();
      const { emitted } = render(GuestCounter, { props: { modelValue: 1 } });

      await user.click(plus());

      // emitted() 記錄每次 emit 的參數陣列：[[第 1 次的參數], [第 2 次的參數], ...]
      expect(emitted()['update:modelValue']).toEqual([[2]]);
    });
  });
});
