// background.js - хранилище треков TikTok Music Overlay
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
// prependNew = true → новые треки кладём в начало (свежие сверху).
// На первом фетче (пустое хранилище) сохраняем порядок API - push.
function upsertPreserveOrder(list, track, prependNew) {
  const idx = findTrackIdx(list, track);
  if (idx >= 0) {
    const cur = list[idx];
    const changed =
      cur.url !== track.url ||
      cur.title !== track.title ||
      cur.author !== track.author ||
      cur.cover !== track.cover;
    if (!changed) return 'skip';
    // сохраняем исходную позицию
    list[idx] = { ...cur, ...track, foundAt: cur.foundAt || track.foundAt };
    return 'updated';
  }
  if (prependNew) list.unshift(track);
  else list.push(track);
  return 'added';
}

// Сохранить один трек (в конец, чтобы сохранить порядок)
async function saveOne(track) {
  if (!track || !track.url) return;
  return serialize(async () => {
    const data = await chrome.storage.local.get(STORE_KEY);
    const list = data[STORE_KEY] || [];
    const prepend = list.length > 0; // при непустом хранилище - новые наверх
    if (upsertPreserveOrder(list, track, prepend) === 'skip') return;
    if (list.length > 500) list.splice(500); // обрезаем хвост, а не голову
    await chrome.storage.local.set({ [STORE_KEY]: list });
    notifyTabs();
  });
}

async function saveMany(tracks) {
  return serialize(async () => {
    const data = await chrome.storage.local.get(STORE_KEY);
    const list = data[STORE_KEY] || [];
    const hadItems = list.length > 0;
    let changed = false;
    // При prepend каждый unshift разворачивает порядок - итерируем с конца,
    // чтобы итоговый порядок совпал с порядком в массиве tracks.
    const src = hadItems ? tracks.slice().reverse() : tracks;
    for (const t of src) {
      if (!t || !t.url) continue;
      if (upsertPreserveOrder(list, t, hadItems) !== 'skip') changed = true;
    }
    if (changed) {
      if (list.length > 500) list.splice(500);
      await chrome.storage.local.set({ [STORE_KEY]: list });
      notifyTabs();
    }
  });
}

// Прямые аудио-URL из Studio (только как дополнение - их лучше в конец)
const AUDIO_MIME_RE = /mime_type=audio/i;
const JUNK_RE = /(browser-settings|zoomcover|\.avif|\.jpe?g|\.png|\.webp|\.gif|\.svg|\.css|\.js|\.json|\.html|\.m3u8)/i;
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    if (!url || details.method !== 'GET') return;
    if (!AUDIO_MIME_RE.test(url) || JUNK_RE.test(url)) return;
    const name = decodeURIComponent((url.split('?')[0].split('/').pop() || 'track'));
    saveOne({ url, name, title: name, author: '', foundAt: Date.now() });
  },
  { urls: ['https://*.tiktokcdn.com/*', 'https://*.tiktokcdn-us.com/*', 'https://*.tiktokcdn-eu.com/*', 'https://*.tiktokv.com/*', 'https://*.byteoversea.com/*', 'https://*.ibytedtos.com/*'] }
);

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
