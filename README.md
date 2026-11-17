# 餐廳預約前台（Mock API 版）

用 Vue 3 + Quasar 做的預約頁，示範**函式測試、元件測試、跨元件整合測試**三層前端測試。
API 全部用 [MSW](https://mswjs.io/) 模擬，不需要後端。

規則與文案來自同一份[規格書](docs/規格書_v1.xlsx)。對照組是 `dine_restaurant`（原生 HTML/JS + Hono + D1，打真 API，E2E 用 Playwright）。

## 快速開始

需要 Node.js 22 以上。

```bash
npm install
npm run dev            # http://localhost:5173，頁面上方會顯示 Mock API mode
npm run test           # watch 模式，改檔自動重跑
npm run test:report    # 跑全部測試 + 覆蓋率，產生報告
npm run report:open    # 打開 HTML 測試報告
```

| 指令 | 說明 |
| --- | --- |
| `npm run test:run` | 全部測試跑一次 |
| `npm run test:unit` | 只跑函式＋元件測試（`tests/unit`、`tests/component`） |
| `npm run test:integration` | 只跑整合測試（`tests/integration`） |
| `npm run typecheck` | `vue-tsc` 型別檢查 |
| `npm run lint` | ESLint（Vue、TypeScript 規則） |

報告位置：
- 測試結果：`reports/html/index.html`（Vitest UI，可以看每個測試的狀態、耗時、原始碼）
- 覆蓋率：`reports/coverage/index.html`

push 到 GitHub 後，[GitHub Actions](.github/workflows/test.yml) 會自動跑 Lint、型別檢查和測試，並把兩份報告上傳成 artifact。測試失敗時也會上傳。

