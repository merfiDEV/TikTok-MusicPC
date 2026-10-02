// content-music.js - добавляет кнопку "В избранное" на странице музыки TikTok
// https://www.tiktok.com/music/<slug>-<musicId>
(function () {
  if (window.__ttmMusicLoaded) return;
  window.__ttmMusicLoaded = true;

  console.log('[TTM] content-music loaded');

  const AID = '1988';

  const SVG = {
    heartOutline: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M24 42.7 6.7 25.4a11.9 11.9 0 0 1 0-16.9 11.9 11.9 0 0 1 16.9 0l.4.4.4-.4a11.9 11.9 0 0 1 16.9 0 11.9 11.9 0 0 1 0 16.9L24 42.7Zm-9.6-31.5a8.9 8.9 0 0 0-6.3 15.2L24 40.3l15.9-13.9a8.9 8.9 0 1 0-12.6-12.6L24 17.1l-3.3-4.6a8.9 8.9 0 0 0-6.3-1.3Z"/></svg>',
    heartFilled: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M24 42.7 6.7 25.4a11.9 11.9 0 0 1 0-16.9 11.9 11.9 0 0 1 16.9 0l.4.4.4-.4a11.9 11.9 0 0 1 16.9 0 11.9 11.9 0 0 1 0 16.9L24 42.7Z"/></svg>',
    spinner: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="4"><circle cx="24" cy="24" r="18" opacity=".25"/><path d="M42 24a18 18 0 0 0-18-18" stroke-linecap="round"/></svg>'
  };

  function getMusicId() {
    const m = location.pathname.match(/-(\d+)\/?$/);
    if (m) return m[1];
    const m2 = location.pathname.match(/(\d{15,})/);
    return m2 ? m2[1] : null;
  }

  // ---- API ----
  async function isInFavorites(musicId) {
    try {
      const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      let secUid = null;
      if (el) {
        const d = JSON.parse(el.textContent);
        secUid = d && d['__DEFAULT_SCOPE__'] && d['__DEFAULT_SCOPE__']['webapp.user-detail']
          && d['__DEFAULT_SCOPE__']['webapp.user-detail'].userInfo
          && d['__DEFAULT_SCOPE__']['webapp.user-detail'].userInfo.user
          && d['__DEFAULT_SCOPE__']['webapp.user-detail'].userInfo.user.secUid;
      }
      if (!secUid) {
        const mm = document.documentElement.innerHTML.match(/"secUid":"(MS4[^"]+)"/);
        if (mm) secUid = mm[1];
      }
      if (!secUid) return null;
      // count > 20 сервер не принимает (вернёт пустой список), поэтому пагинируем по 20.
      // Защитный лимит: 50 страниц = 1000 треков.
      const target = String(musicId);
      let cursor = 0;
      for (let page = 0; page < 50; page++) {
        const url = '/api/user/collect/music_list/?secUid=' + encodeURIComponent(secUid)
          + '&appId=1988&cursor=' + cursor + '&count=20&aid=1988';
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        const list = data.musicList || [];
        for (const it of list) {
          if (it.music && String(it.music.id) === target) return true;
        }
        cursor = data.cursor;
        if (!data.hasMore) break;
      }
      return false;
    } catch (e) {
      console.log('[TTM] isInFavorites err', e);
      return null;
    }
  }

  async function collectMusic(musicId, add) {
    const params = new URLSearchParams();
    params.append('musicId', musicId);
    params.append('action', add ? '1' : '2');
    params.append('aid', AID);
    const res = await fetch('/api/music/collect/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    return data && (data.statusCode === 0 || data.status_code === 0);
  }

  // ---- UI ----
  let btn = null;

  function render(state) {
    // state: 'loading' | 'in' | 'out' | 'busy' | 'error'
    if (!btn) return;
    btn.classList.remove('is-in', 'is-busy', 'is-error');
    let label = 'В избранное';
    let icon = SVG.heartOutline;
    if (state === 'loading') { label = 'Проверка...'; icon = SVG.spinner; btn.classList.add('is-busy'); }
    else if (state === 'in') { label = 'В избранном'; icon = SVG.heartFilled; btn.classList.add('is-in'); }
    else if (state === 'out') { label = 'В избранное'; icon = SVG.heartOutline; }
    else if (state === 'busy') { label = 'Сохраняю...'; icon = SVG.spinner; btn.classList.add('is-busy'); }
    else if (state === 'error') { label = 'Ошибка'; icon = SVG.heartOutline; btn.classList.add('is-error'); }
    btn.innerHTML = '<span class="ttm-fav-icon">' + icon + '</span><span class="ttm-fav-label">' + label + '</span>';
  }

  async function refresh() {
    const musicId = getMusicId();
    if (!musicId) return;
    render('loading');
    const inFav = await isInFavorites(musicId);
    if (inFav === null) { render('out'); return; }
    render(inFav ? 'in' : 'out');
  }

  async function toggle() {
    const musicId = getMusicId();
    if (!musicId || !btn) return;
    const currentlyIn = btn.classList.contains('is-in');
    render('busy');
    try {
      const ok = await collectMusic(musicId, !currentlyIn);
      if (!ok) throw new Error('api error');
      render(currentlyIn ? 'out' : 'in');
    } catch (e) {
      console.log('[TTM] toggle err', e);
      render('error');
      setTimeout(() => render(currentlyIn ? 'in' : 'out'), 1500);
    }
  }

  function buildButton(afterEl) {
    if (btn) return;
    btn = document.createElement('button');
    btn.id = 'ttm-fav-btn';
    btn.type = 'button';
    btn.className = 'ttm-fav';
    btn.onclick = toggle;
    // вставляем сразу после h1 (перед автором и счётчиком видео)
    afterEl.insertAdjacentElement('afterend', btn);
    render('loading');
  }

  function tryInject() {
    if (btn && document.contains(btn)) return true;
    const h1 = document.querySelector('h1[data-e2e="music-title"]') || document.querySelector('h1');
    if (!h1 || !h1.parentElement) return false;
    buildButton(h1);
    refresh();
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (tryInject() || tries > 40) clearInterval(timer);
  }, 500);

  // SPA-навигация: переинжект при смене URL
  let lastUrl = location.href;
  const obs = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (btn) btn.remove();
      btn = null;
      setTimeout(() => { if (tryInject()) refresh(); }, 500);
    } else if (!btn || !document.contains(btn)) {
      tryInject();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
