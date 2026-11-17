// 第 3 層：跨元件整合測試 —— 掛整個 BookingForm（真的子元件 + 真的 composable + 真的 axios），
// 只在「網路邊界」用 MSW 模擬後端。假資料來自 Postman example（src/mocks/handlers.ts）。
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import BookingForm from '@/components/BookingForm.vue';
import { server } from '@/mocks/server';
import { fixtures, scenarios } from '@/mocks/handlers';
import { MSG } from '@/messages';
import { installQuasarPlugin } from '../helpers/installQuasarPlugin';

installQuasarPlugin();

// 固定「現在」為台北 2026-11-11 12:00 → 可預約 2026-11-12 ~ 2026-12-11
// 只假造 Date，setTimeout 等計時器維持真實，MSW 與 user-event 才能正常運作
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T04:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

/** 記錄 MSW 收到的請求，用來斷言「有沒有打 API、打了幾次、帶了什麼」 */
function recordRequests() {
  const requests: Request[] = [];
  server.events.on('request:start', ({ request }) => requests.push(request.clone()));
  return {
    all: requests,
    posts: () => requests.filter((r) => r.method === 'POST'),
    availabilityFor: (date: string) =>
      requests.filter((r) => r.method === 'GET' && new URL(r.url).searchParams.get('date') === date),
  };
}

/** 回傳一個可以手動放行的 Promise，用來把 API 回應「卡住」 */
function gate() {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open };
}

const submitButton = () => screen.getByRole('button', { name: 'MAKE RESERVATION' });
const dateInput = () => screen.getByLabelText('Date');

// <input type="date"> 無法用鍵盤逐字輸入，用 fireEvent.update 直接設值並觸發 input 事件
const pickDate = (date: string) => fireEvent.update(dateInput(), date);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Amy');
  await user.type(screen.getByLabelText('Phone'), '0912345678');
  await pickDate('2026-11-14');
  await user.click(await screen.findByRole('radio', { name: '12:30 · 5 left' }));
  await user.click(screen.getByRole('button', { name: 'Increase guests' })); // 人數 2
}

describe('BookingForm 整合測試', () => {
  describe('lifecycle', () => {
    it('onMounted：掛載後自動取得可預約範圍，日期欄設定 min / max（TC-04-1）', async () => {
      const requests = recordRequests();
      render(BookingForm);

      // 一開始還沒有回應，min / max 要等 API 回來才會出現：用 waitFor 等畫面更新
      await waitFor(() => expect(dateInput()).toHaveAttribute('min', '2026-11-12'));
      expect(dateInput()).toHaveAttribute('max', '2026-12-11');
      expect(requests.availabilityFor('2026-11-11')).toHaveLength(1); // 用台北的「今天」查詢
    });

    it('watch：選日期後重新取得該日名額，時段更新剩餘數', async () => {
      const requests = recordRequests();
      render(BookingForm);

      // 還沒選日期：時段都不能選
      expect(screen.getByRole('radio', { name: '12:30 · Pick a date' })).toHaveAttribute('aria-disabled', 'true');

      await pickDate('2026-11-14');

      expect(await screen.findByRole('radio', { name: '12:30 · 5 left' })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('radio', { name: '17:30 · Full' })).toHaveAttribute('aria-disabled', 'true');
      expect(requests.availabilityFor('2026-11-14')).toHaveLength(1);
    });

    it('onUnmounted：離開頁面時取消還在等待的請求', async () => {
      const pending = gate();
      let signal: AbortSignal | undefined;
      server.use(
        http.get('/api/availability', async ({ request }) => {
          signal = request.signal;
          await pending.promise; // 讓請求一直卡著，模擬網路很慢
          return HttpResponse.json(fixtures.availability.body);
        }),
      );

      const { unmount } = render(BookingForm);
      await waitFor(() => expect(signal).toBeDefined()); // 請求已送出

      unmount();

      expect(signal!.aborted).toBe(true);
      pending.open();
    });
  });

  it('TC-01-1：全部空白送出，4 個欄位顯示 This field is required，且不送出預約請求', async () => {
    const user = userEvent.setup();
    const requests = recordRequests();
    render(BookingForm);

    await user.click(submitButton());

    expect(await screen.findAllByText(MSG.REQUIRED)).toHaveLength(4); // 姓名、電話、日期、時段
    expect(requests.posts()).toHaveLength(0);
  });

  it('TC-02-1：電話格式錯誤，顯示 Please enter a valid phone number', async () => {
    const user = userEvent.setup();
    const requests = recordRequests();
    render(BookingForm);

    await fillValidForm(user);
    await user.clear(screen.getByLabelText('Phone'));
    await user.type(screen.getByLabelText('Phone'), '0812345678');
    await user.click(submitButton());

    expect(await screen.findByText(MSG.INVALID_PHONE)).toBeInTheDocument();
    expect(requests.posts()).toHaveLength(0);
  });

  it('TC-06-1：填好送出 → 顯示 Reservation confirmed，送出的內容與 header 正確', async () => {
    const user = userEvent.setup();
    const requests = recordRequests();
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: MSG.CONFIRMED })).toBeInTheDocument();
    expect(screen.getByText('Amy, 2 guest(s) on 2026-11-14 at 12:30')).toBeInTheDocument();

    // MSW 在網路層攔截，所以連 axios 設定的 header 與序列化結果都驗得到（vi.mock 做不到）
    const [post] = requests.posts();
    expect(post.headers.get('content-type')).toContain('application/json');
    expect(await post.json()).toEqual({ name: 'Amy', phone: '0912345678', date: '2026-11-14', slot: '12:30', guests: 2 });
  });

  it('TC-06-2：409 SLOT_FULL → 顯示 Only 5 seats left for this time，並重新取得名額', async () => {
    const user = userEvent.setup();
    const requests = recordRequests();
    server.use(scenarios.slotFull());
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Only 5 seats left for this time');
    await waitFor(() => expect(requests.availabilityFor('2026-11-14')).toHaveLength(2)); // 選日期 1 次 + 失敗後 1 次
  });

  it('TC-07-1：409 DUPLICATE → 顯示 You already have a reservation for this time', async () => {
    const user = userEvent.setup();
    server.use(scenarios.duplicate());
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.DUPLICATE);
  });

  it('TC-07-2：連按兩次送出只送 1 次，送出期間按鈕停用', async () => {
    const user = userEvent.setup();
    const requests = recordRequests();
    const pending = gate();
    server.use(
      http.post('/api/reservations', async ({ request }) => {
        await pending.promise; // 卡住回應，才看得到「送出中」的狀態
        return HttpResponse.json({ ...fixtures.created.body, ...((await request.json()) as object) }, { status: 201 });
      }),
    );
    render(BookingForm);

    await fillValidForm(user);
    await user.dblClick(submitButton());

    await waitFor(() => expect(submitButton()).toBeDisabled());
    pending.open();

    expect(await screen.findByRole('heading', { name: MSG.CONFIRMED })).toBeInTheDocument();
    expect(requests.posts()).toHaveLength(1);
  });

  it('BR-08：前端檢查通過但後端回 400 VALIDATION_ERROR，錯誤顯示在對應欄位', async () => {
    const user = userEvent.setup();
    server.use(scenarios.validationError()); // name REQUIRED、phone INVALID_PHONE、guests OUT_OF_RANGE
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());

    expect(await screen.findByText(MSG.REQUIRED)).toBeInTheDocument();
    expect(screen.getByText(MSG.INVALID_PHONE)).toBeInTheDocument();
    // guests 沒有欄位，顯示在表單層級。Quasar 的欄位錯誤也是 role="alert"，所以這裡用文字查詢
    expect(screen.getByText(MSG.GENERIC)).toBeInTheDocument();
  });

  it('網路錯誤 → 顯示通用錯誤訊息，按鈕恢復可按', async () => {
    const user = userEvent.setup();
    server.use(scenarios.networkError());
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG.GENERIC);
    expect(submitButton()).toBeEnabled();
  });

  it('預約成功後按 Make another reservation 回到空白表單', async () => {
    const user = userEvent.setup();
    render(BookingForm);

    await fillValidForm(user);
    await user.click(submitButton());
    await user.click(await screen.findByRole('button', { name: 'Make another reservation' }));

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByRole('radio', { name: '12:30 · Pick a date' })).toBeInTheDocument();
  });
});
