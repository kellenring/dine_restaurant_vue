import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // 產出物與 MSW 自動產生的 worker 不檢查
  { ignores: ['dist/', 'reports/', 'public/mockServiceWorker.js'] },

  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 純排版規則：專案沒有格式化工具，關掉以免程式碼和簡報範例對不上
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },

  // .vue 的 <script lang="ts"> 交給 TypeScript parser
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
);
