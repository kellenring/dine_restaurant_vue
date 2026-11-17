import { config } from '@vue/test-utils';
import { Quasar, type QuasarPluginOptions } from 'quasar';
import { afterAll, beforeAll } from 'vitest';

/**
 * 在這個測試檔掛載的元件都能用 Quasar 元件。
 *
 * 用法與 @quasar/quasar-app-extension-testing-unit-vitest 的同名函式相同，
 * 但不需要安裝 Quasar CLI（@quasar/app-vite）。
 * @testing-library/vue 底層是 Vue Test Utils，所以設定 VTU 的全域 plugins 就會生效。
 */
export function installQuasarPlugin(options: Partial<QuasarPluginOptions> = {}) {
  let backup: typeof config.global.plugins = [];

  beforeAll(() => {
    backup = config.global.plugins;
    config.global.plugins = [[Quasar, options], ...backup];
  });

  afterAll(() => {
    config.global.plugins = backup;
  });
}
