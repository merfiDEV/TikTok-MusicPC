// content-studio.js — TikTok Studio: тянет треки из 'Избранного' через API
(function () {
  if (window.__ttmStudioLoaded) return;
  window.__ttmStudioLoaded = true;

  const STORE_KEY = 'ttm_tracks';

  // Достаём secUid текущего пользователя из контекста страницы
  function getSecUid() {
    try {
      const el = document.getElementById('__Creator_Center_Context__');
      if (el) {
        const ctx = JSON.parse(el.textContent);
        return ctx?.commonAppContext?.user?.secUid;
      }
    } catch (e) {}
    return null;
  }

  async function fetchFavoriteMusic() {
    const secUid = getSecUid();
    if (!secUid) return;
    let cursor = 0;
    let all = [];
    for (let i = 0; i < 20; i++) {
      const url = '/api/user/collect/music_list/?secUid=' + encodeURIComponent(secUid) +
        '&appId=1988&cursor=' + cursor + '&count=20&aid=1988';
      let data;
      try {
        const res = await fetch(url, { credentials: 'include' });
        data = await res.json();
      } catch (e) { break; }
      const list = data.musicList || [];
      for (const item of list) {
        const m = item.music || {};
        if (!m.playUrl) continue;
        all.push({
          id: m.id,
          url: m.playUrl,
          title: m.title || '',
          author: m.authorName || '',
          cover: m.coverMedium || '',
          duration: m.duration || 0,
          foundAt: Date.now()
        });
      }
      cursor = data.cursor;
      if (!data.hasMore) break;
    }
    if (all.length) {
      // сохраняем через background
      chrome.runtime.sendMessage({ type: 'TTM_SAVE_MANY', tracks: all });
    }
  }

  // запускаем при заходе на Studio и при клике по вкладке 'Избранное'
  setTimeout(fetchFavoriteMusic, 3000);
  document.addEventListener('click', (e) => {
    const t = (e.target?.innerText || '').trim();
    if (t === 'Избранное') setTimeout(fetchFavoriteMusic, 1500);
  }, true);
})();