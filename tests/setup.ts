// 讓 expect 多出 toBeInTheDocument、toBeDisabled、toHaveAttribute 等 DOM 比對方法
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/vue';
import { server } from '@/mocks/server';

// MSW：所有測試共用一個假後端；沒有對應 handler 的請求直接報錯，避免悄悄打到外部
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup(); // 沒開 Vitest globals 時 Testing Library 不會自動清畫面：每個測試結束卸載元件
  server.resetHandlers(); // 拿掉個別測試用 server.use() 加的情境
  server.events.removeAllListeners();
});

afterAll(() => server.close());
