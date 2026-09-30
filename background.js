// background.js — хранилище треков TikTok Music Overlay
const STORE_KEY = 'ttm_tracks';

async function notifyTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.tiktok.com/@*' });
    for (const tb of tabs) {
      chrome.tabs.sendMessage(tb.id, { type: 'TTM_TRACKS_UPDATED' }).catch(() => {});
    }
  } catch (e) {}
}

// Сериализация записи: гарантирует сохранение порядка треков.
// Без этого параллельные saveOne делают read-modify-write гонкой и перетирают друг друга.
let writeChain = Promise.resolve();
function serialize(fn) {
  const p = writeChain.then(fn, fn);
  writeChain = p.catch(() => {});
  return p;
}

// Ищем трек по id (приоритет) или по url. Нужно, чтобы повторный фетч
// обновлял подписанный URL на месте, а не добавлял дубликат в конец.
function findTrackIdx(list, track) {
  if (track.id != null) {
    const i = list.findIndex(t => t.id === track.id);
    if (i >= 0) return i;
  }
  return list.findIndex(t => t.url === track.url);
}

// Возвращает 'added' | 'updated' | 'skip'
// Порядок треков = порядок, в котором их отдаёт API /api/user/collect/music_list/.
// Он же совпадает с порядком в UI TikTok Studio (проверено: UI не пересортировывает).
// Поэтому новые треки ВСЕГДА добавляем в конец (push), никогда не unshift —
// иначе при поштучной отправке порядок переворачивается.
function upsertPreserveOrder(list, track) {
  const idx = findTrackIdx(list, track);
  if (idx >= 0) {
    const cur = list[idx];
    const changed =
      cur.url !== track.url ||
      cur.title !== track.title ||
      cur.author !== track.author ||
      cur.cover !== track.cover;
    if (!changed) return 'skip';
    // сохраняем исходную позицию — не перескакивает в конец при обновлении playUrl
    list[idx] = { ...cur, ...track, foundAt: cur.foundAt || track.foundAt };
    return 'updated';
  }
  list.push(track);
  return 'added';
}

// Сохранить один трек (в конец, чтобы сохранить порядок)
async function saveOne(track) {
  if (!track || !track.url) return;
  return serialize(async () => {
    const data = await chrome.storage.local.get(STORE_KEY);
    const list = data[STORE_KEY] || [];
    if (upsertPreserveOrder(list, track) === 'skip') return;
    if (list.length > 500) list.length = 500; // обрезаем хвост
    await chrome.storage.local.set({ [STORE_KEY]: list });
    notifyTabs();
  });
}

async function saveMany(tracks) {
  return serialize(async () => {
    const data = await chrome.storage.local.get(STORE_KEY);
    const list = data[STORE_KEY] || [];
    let changed = false;
    for (const t of tracks) {
      if (!t || !t.url) continue;
      if (upsertPreserveOrder(list, t) !== 'skip') changed = true;
    }
    if (changed) {
      if (list.length > 500) list.length = 500;
      await chrome.storage.local.set({ [STORE_KEY]: list });
      notifyTabs();
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'TTM_GET_TRACKS') {
    chrome.storage.local.get(STORE_KEY).then(d => sendResponse({ tracks: d[STORE_KEY] || [] }));
    return true;
  }
  if (msg && msg.type === 'TTM_CLEAR_TRACKS') {
    chrome.storage.local.set({ [STORE_KEY]: [] }).then(() => { notifyTabs(); sendResponse({ ok: true }); });
    return true;
  }
  if (msg && msg.type === 'TTM_SAVE_MANY') {
    saveMany(msg.tracks || []).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg && msg.type === 'TTM_SAVE_MANUAL') {
    saveOne(msg.track).then(() => sendResponse({ ok: true }));
    return true;
  }
});
