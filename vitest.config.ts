import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['tests/setup.ts'],
      include: ['tests/**/*.spec.ts'],
      // Quasar 以原始碼形式發佈，需要交給 Vite 轉譯
      server: { deps: { inline: ['quasar'] } },
      reporters: [
        'default',
        ['html', { outputDir: 'reports/html' }],
        // CI 上把測試結果寫進 GitHub 的 Job Summary（有設定 reporters 時 Vitest 不會自動加）
        ...(process.env.GITHUB_ACTIONS === 'true' ? ['github-actions' as const] : []),
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'], // json-summary 給 CI 的 Job Summary 讀
        reportsDirectory: 'reports/coverage',
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/mocks/**', 'src/main.ts', 'src/App.vue', 'src/**/*.d.ts'],
      },
    },
  }),
);
