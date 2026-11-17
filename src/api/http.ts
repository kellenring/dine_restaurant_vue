import axios, { AxiosError } from 'axios';
import type { ApiError } from '@/utils/validation';

/**
 * 所有 API 共用的 axios instance。
 * 整合測試用 MSW 在網路層攔截，所以這裡的 baseURL、header、interceptor 都會被測到；
 * 若改用 vi.mock('@/api/reservations')，這一層會被整個跳過。
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// 統一錯誤格式：畫面只需要處理 ApiError，不用知道 axios 的錯誤結構
http.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isCancel(err)) return Promise.reject(err); // 元件卸載時主動取消，交給呼叫端忽略
    const res = (err as AxiosError<Partial<ApiError>>).response;
    const apiError: ApiError = {
      ...res?.data,
      status: res?.status ?? 0,
      error: res?.data?.error ?? 'NETWORK_ERROR',
    };
    return Promise.reject(apiError);
  },
);

export const isCanceled = (err: unknown) => axios.isCancel(err);
