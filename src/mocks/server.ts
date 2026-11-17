// Node 環境（Vitest）：在網路層攔截 axios 送出的請求
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
