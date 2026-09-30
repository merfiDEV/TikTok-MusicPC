// content-profile.js — страница https://www.tiktok.com/@*
(function () {
  if (window.__ttmProfileLoaded) return;
  window.__ttmProfileLoaded = true;
  let tracks = [];
  let currentIdx = -1;

  const audioEl = document.createElement('audio');
  audioEl.id = 'ttm-audio';
  audioEl.controls = true;
  audioEl.preload = 'none';

  console.log('[TTM] content-profile loaded');

  function getSecUid() {
    try {
      const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (el) {
        const data = JSON.parse(el.textContent);
        const user = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo?.user;
        if (user?.secUid) return user.secUid;
      }
    } catch (e) {}
    try {
      const m = document.documentElement.innerHTML.match(/"secUid":"(MS4[^"]+)"/);
      if (m) return m[1];
    } catch (e) {}
    return null;
  }

  // отдаём трек в background сразу (по одному)
  function pushTrack(t) {
    chrome.runtime.sendMessage({ type: 'TTM_SAVE_MANUAL', track: t }, (res) => {
      if (chrome.runtime.lastError) console.log('[TTM] save err', chrome.runtime.lastError.message);
    });
  }

  let fetching = false;
  async function fetchFavoriteMusic() {
    if (fetching) return;
    fetching = true;
    const secUid = getSecUid();
    console.log('[TTM] secUid =', secUid);
    if (!secUid) { fetching = false; return; }
    try {
      let cursor = 0;
      for (let i = 0; i < 25; i++) {
        const url = '/api/user/collect/music_list/?secUid=' + encodeURIComponent(secUid) +
          '&appId=1988&cursor=' + cursor + '&count=20&aid=1988';
        let data;
        try {
          const res = await fetch(url, { credentials: 'include' });
          console.log('[TTM] page', i, 'status', res.status);
          data = await res.json();
        } catch (e) { console.log('[TTM] fetch err', e); break; }
        const list = data.musicList || [];
        console.log('[TTM] got', list.length, 'tracks, hasMore=', data.hasMore);
        for (const item of list) {
          const m = item.music || {};
          if (!m.playUrl) continue;
          pushTrack({
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
    } finally { fetching = false; }
  }

  function buildOverlay() {
    if (document.getElementById('ttm-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'ttm-overlay';
    ov.innerHTML = [
      '<div id="ttm-head"><h3>Музыка</h3><button class="ttm-close">×</button></div>',
      '<div id="ttm-now"><div id="ttm-title">—</div><div id="ttm-author"></div></div>',
      '<ul id="ttm-list"></ul>',
      '<div id="ttm-empty">Загрузка треков из Избранного…</div>',
      '<div id="ttm-foot"><button id="ttm-clear">Очистить</button><button id="ttm-refresh">Обновить</button></div>'
    ].join('');
    document.body.appendChild(ov);
    ov.querySelector('.ttm-close').onclick = () => ov.classList.remove('ttm-open');
    ov.querySelector('#ttm-clear').onclick = () => {
      chrome.runtime.sendMessage({ type: 'TTM_CLEAR_TRACKS' }, () => { tracks = []; currentIdx = -1; render(); });
    };
    ov.querySelector('#ttm-refresh').onclick = () => { fetchFavoriteMusic(); loadTracks(); };
    ov.querySelector('#ttm-now').appendChild(audioEl);
  }

  function render() {
    const list = document.getElementById('ttm-list');
    const empty = document.getElementById('ttm-empty');
    if (!list) return;
    if (!tracks.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const need = tracks.length;
    while (list.children.length < need) {
      const li = document.createElement('li');
      const nm = document.createElement('span'); nm.className = 'ttm-nm';
      const play = document.createElement('span');
      li.appendChild(nm); li.appendChild(play);
      list.appendChild(li);
    }
    while (list.children.length > need) list.removeChild(list.lastChild);
    for (let i = 0; i < need; i++) {
      const li = list.children[i];
      const t = tracks[i];
      const label = (t.title || t.name || ('Трек ' + (i + 1))) + (t.author ? ' — ' + t.author : '');
      const nm = li.firstChild;
      if (nm.textContent !== label) nm.textContent = label;
      const play = li.lastChild;
      const sign = i === currentIdx ? '▶' : '⏵';
      if (play.textContent !== sign) play.textContent = sign;
      const active = i === currentIdx;
      if (li.classList.contains('ttm-active') !== active) li.classList.toggle('ttm-active', active);
      li.onclick = () => playTrack(i);
    }
  }

  function playTrack(i) {
    const t = tracks[i];
    if (!t) return;
    currentIdx = i;
    document.getElementById('ttm-title').textContent = t.title || t.name || 'Трек';
    document.getElementById('ttm-author').textContent = t.author || '';
    if (audioEl.src !== t.url) audioEl.src = t.url;
    audioEl.play().catch(() => {});
    render();
  }

  function loadTracks() {
    chrome.runtime.sendMessage({ type: 'TTM_GET_TRACKS' }, (res) => {
      if (chrome.runtime.lastError) return;
      tracks = (res && res.tracks) || [];
      render();
    });
  }

  function findTab(text) {
    const els = document.querySelectorAll('[role="tab"], a, button, span, div');
    for (const el of els) {
      if (el.children.length === 0 && (el.textContent || '').trim() === text) return el;
    }
    return null;
  }

  let injected = false;
  function injectTab() {
    if (injected && document.querySelector('.ttm-tab-btn')) return true;
    const video = findTab('Видео') || findTab('Videos') || findTab('Video');
    if (!video) return false;
    let tabEl = video;
    for (let i = 0; i < 4; i++) {
      if (!tabEl.parentElement) break;
      tabEl = tabEl.parentElement;
      const sib = tabEl.parentElement ? tabEl.parentElement.children : [];
      if (sib.length >= 3) break;
    }
    const container = tabEl.parentElement;
    if (!container) return false;
    const btn = document.createElement('div');
    btn.className = 'ttm-tab-btn';
    btn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:0 16px;height:44px;line-height:44px;color:#fff;opacity:.85;white-space:nowrap;cursor:pointer;font-size:15px;';
    btn.innerHTML = '🎵 <span>Музыка</span>';
    btn.onclick = () => {
      buildOverlay();
      document.getElementById('ttm-overlay').classList.add('ttm-open');
      loadTracks();
    };
    container.appendChild(btn);
    injected = true;
    return true;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'TTM_TRACKS_UPDATED') {
      loadTracks();
    }
  });

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (injectTab()) {
      clearInterval(timer);
      loadTracks();
      fetchFavoriteMusic();
    } else if (tries > 40) {
      clearInterval(timer);
    }
  }, 500);
})();