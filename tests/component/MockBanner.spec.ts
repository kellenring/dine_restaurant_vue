import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/vue';
import MockBanner from '@/components/MockBanner.vue';
import { installQuasarPlugin } from '../helpers/installQuasarPlugin';

installQuasarPlugin();

describe('MockBanner', () => {
  it('提示目前是 Mock API 模式，避免誤以為是真環境', () => {
    render(MockBanner);
    expect(screen.getByRole('status')).toHaveTextContent('Mock API mode');
  });
});
