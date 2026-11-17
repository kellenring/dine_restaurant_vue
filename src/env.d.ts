/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 設成 'false' 時不啟動 MSW，改打真的後端 */
  readonly VITE_USE_MOCK?: string;
  /** 真後端網址，例如 http://localhost:8787（dine_restaurant 的 wrangler dev） */
  readonly VITE_API_BASE?: string;
}
