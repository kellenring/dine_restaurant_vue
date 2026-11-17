import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import App from './App.vue';

async function enableMocking() {
  // 預設用 MSW；設 VITE_USE_MOCK=false 並給 VITE_API_BASE，就能改打 dine_restaurant 的真 API
  if (import.meta.env.VITE_USE_MOCK === 'false') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' }); // 頁面資源（JS、字型）照常載入
}

enableMocking().then(() => {
  createApp(App).use(Quasar, {}).mount('#app');
});
