// 瀏覽器環境（npm run dev）：透過 public/mockServiceWorker.js 攔截請求
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
