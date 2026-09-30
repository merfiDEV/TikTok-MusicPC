// content-profile.js - встроенная вкладка "Музыка" на странице https://www.tiktok.com/@*
(function () {
  if (window.__ttmProfileLoaded) return;
  window.__ttmProfileLoaded = true;

  console.log('[TTM] content-profile loaded');

  const SVG = {
    note: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="1em" height="1em"><path d="M35 5v7.98h-7.5V35.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 8.5-8.5c.52 0 1.03.05 1.53.14V13.5H35V5Zm-7.5 10.5v-1H21v15.6a1.5 1.5 0 0 1-.03.28A6.5 6.5 0 1 0 27.5 35.5V15.5Z"/></svg>',
    play: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M18 12.5v23a1 1 0 0 0 1.52.86l18.5-11.5a1 1 0 0 0 0-1.72l-18.5-11.5A1 1 0 0 0 18 12.5Z"/></svg>',
    pause: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14 10a1 1 0 0 0-1 1v26a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-5Zm15 0a1 1 0 0 0-1 1v26a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-5Z"/></svg>',
    prev: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14 11a1 1 0 0 1 1 1v24a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1h2Zm22.53 1.6a1 1 0 0 1 1.47.86v21.08a1 1 0 0 1-1.47.86L17.8 25.86a1 1 0 0 1 0-1.72L36.53 12.6Z"/></svg>',
    next: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M34 11a1 1 0 0 0-1 1v24a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V12a1 1 0 0 0-1-1h-2Zm-22.53 1.6a1 1 0 0 0-1.47.86v21.08a1 1 0 0 0 1.47.86L30.2 25.86a1 1 0 0 0 0-1.72L11.47 12.6Z"/></svg>',
    refresh: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M40 8a1 1 0 0 0-1 1v6.5A16 16 0 0 0 8.87 19.4a1 1 0 0 0 1.9.62A14 14 0 0 1 37 17.1V23a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1ZM8 40a1 1 0 0 0 1-1v-6.5A16 16 0 0 0 39.13 28.6a1 1 0 0 0-1.9-.62A14 14 0 0 1 11 30.9V25a1 1 0 0 0-2 0v14a1 1 0 0 0 1 1Z"/></svg>',
    trash: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M18 4a1 1 0 0 0-1 1v2H8a1 1 0 0 0 0 2h1.5l2.6 28.7A3 3 0 0 0 15.1 40h17.8a3 3 0 0 0 3-2.3l2.6-28.7H40a1 1 0 0 0 0-2H31V5a1 1 0 0 0-1-1H18Zm3 4V6h6v2h-6Zm-8.5 2h24.9l-2.5 28.4a1 1 0 0 1-1 .6H15.1a1 1 0 0 1-1-.6L11.5 10Z"/></svg>',
    volume: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M24 6a1 1 0 0 0-1.62-.78L11.6 13H6a1 1 0 0 0-1 1v20a1 1 0 0 0 1 1h5.6l10.78 7.78A1 1 0 0 0 24 42V6ZM22 9.16v29.68L12.62 32H7V16h5.62L22 9.16ZM31.5 16.5a1 1 0 0 0-1.41 1.41 8.5 8.5 0 0 1 0 12.18 1 1 0 1 0 1.41 1.41 10.5 10.5 0 0 0 0-15Zm4.24-4.24a1 1 0 0 0-1.41 1.41 14.5 14.5 0 0 1 0 20.66 1 1 0 1 0 1.41 1.41 16.5 16.5 0 0 0 0-23.48Z"/></svg>',
    close: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10.7 10.7a1 1 0 0 1 1.4 0L24 22.59 35.9 10.7a1 1 0 1 1 1.4 1.41L25.41 24l11.9 11.9a1 1 0 0 1-1.42 1.4L24 25.41 12.1 37.3a1 1 0 0 1-1.4-1.42L22.59 24 10.7 12.1a1 1 0 0 1 0-1.4Z"/></svg>',
    download: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M24 5a1 1 0 0 1 1 1v22.59l6.29-6.3a1 1 0 1 1 1.42 1.42l-8 8a1 1 0 0 1-1.42 0l-8-8a1 1 0 1 1 1.42-1.42L23 28.59V6a1 1 0 0 1 1-1ZM9 34a1 1 0 0 1 1 1v4h28v-4a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z"/></svg>'
  };

  const state = {
    tracks: [],
    currentIdx: -1,
    playing: false,
    showSection: false
  };

  // ---- секция и плеер ----
  let sectionEl = null;
  let gridEl = null;
  let emptyEl = null;
  let countEl = null;
  let playerEl = null;
  let audio = null;

  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  };

  function buildSection() {
    if (sectionEl) return;
    sectionEl = document.createElement('div');
    sectionEl.id = 'ttm-section';
    sectionEl.innerHTML = [
      '<div class="ttm-head">',
        '<h3>Музыка<span class="ttm-count" id="ttm-count"></span></h3>',
        '<div class="ttm-actions">',
          '<button class="ttm-btn" id="ttm-refresh" title="Обновить">' + SVG.refresh + '<span>Обновить</span></button>',
          '<button class="ttm-btn" id="ttm-clear" title="Очистить">' + SVG.trash + '<span>Очистить</span></button>',
        '</div>',
      '</div>',
      '<div class="ttm-empty">Загрузка треков из Избранного…</div>',
      '<div class="ttm-grid" id="ttm-grid"></div>'
    ].join('');
    gridEl = sectionEl.querySelector('#ttm-grid');
    emptyEl = sectionEl.querySelector('.ttm-empty');
    countEl = sectionEl.querySelector('#ttm-count');

    sectionEl.querySelector('#ttm-refresh').onclick = () => { fetchFavoriteMusic(); loadTracks(); };
    sectionEl.querySelector('#ttm-clear').onclick = () => {
      chrome.runtime.sendMessage({ type: 'TTM_CLEAR_TRACKS' }, () => {
        state.tracks = []; state.currentIdx = -1; renderTracks();
      });
    };
  }

  function buildPlayer() {
    if (playerEl) return;
    playerEl = document.createElement('div');
    playerEl.id = 'ttm-player';
    playerEl.innerHTML = [
      '<div class="ttm-p-controls">',
        '<div class="ttm-p-btn" id="ttm-p-prev" title="Назад">' + SVG.prev + '</div>',
        '<div class="ttm-p-btn ttm-p-main" id="ttm-p-toggle" title="Плей/пауза">' + SVG.play + '</div>',
        '<div class="ttm-p-btn" id="ttm-p-next" title="Вперёд">' + SVG.next + '</div>',
      '</div>',
      '<div class="ttm-p-meta">',
        '<div class="ttm-p-title" id="ttm-p-title">-</div>',
        '<div class="ttm-p-author" id="ttm-p-author"></div>',
      '</div>',
      '<div class="ttm-p-seek">',
        '<div class="ttm-p-time" id="ttm-p-cur">0:00</div>',
        '<div class="ttm-p-bar" id="ttm-p-bar">',
          '<div class="ttm-p-fill" id="ttm-p-fill"></div>',
          '<div class="ttm-p-knob" id="ttm-p-knob"></div>',
        '</div>',
        '<div class="ttm-p-time" id="ttm-p-dur">0:00</div>',
      '</div>',
      '<div class="ttm-p-vol">',
        SVG.volume,
        '<input type="range" min="0" max="1" step="0.01" value="1" id="ttm-p-vol">',
      '</div>'
    ].join('');
    document.body.appendChild(playerEl);

    audio = document.createElement('audio');
    audio.id = 'ttm-audio-native';
    audio.preload = 'metadata';
    document.body.appendChild(audio);

    const $ = (id) => playerEl.querySelector('#' + id);

    $('ttm-p-prev').onclick = () => playTrack(state.currentIdx - 1);
    $('ttm-p-next').onclick = () => playTrack(state.currentIdx + 1);
    $('ttm-p-toggle').onclick = () => {
      if (!audio.src) return;
      if (audio.paused) audio.play().catch(()=>{});
      else audio.pause();
    };

    const bar = $('ttm-p-bar');
    bar.addEventListener('click', (e) => {
      const r = bar.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
    });

    $('ttm-p-vol').addEventListener('input', (e) => {
      audio.volume = +e.target.value;
    });

    audio.addEventListener('play', () => {
      state.playing = true;
      $('ttm-p-toggle').innerHTML = SVG.pause;
      renderTracks();
    });
    audio.addEventListener('pause', () => {
      state.playing = false;
      $('ttm-p-toggle').innerHTML = SVG.play;
      renderTracks();
    });
    audio.addEventListener('timeupdate', () => {
      const d = audio.duration || 0;
      const c = audio.currentTime || 0;
      $('ttm-p-cur').textContent = fmtTime(c);
      $('ttm-p-dur').textContent = fmtTime(d);
      const pct = d ? (c / d) * 100 : 0;
      $('ttm-p-fill').style.width = pct + '%';
      $('ttm-p-knob').style.left = pct + '%';
    });
    audio.addEventListener('ended', () => {
      if (state.currentIdx + 1 < state.tracks.length) playTrack(state.currentIdx + 1);
    });
  }

  function renderTracks() {
    if (!gridEl) return;
    const tracks = state.tracks;
    countEl.textContent = tracks.length ? ' · ' + tracks.length : '';
    sectionEl.classList.toggle('is-empty', tracks.length === 0);
    emptyEl.textContent = tracks.length ? '' : 'Треков пока нет. Нажми «Обновить».';

    const need = tracks.length;
    while (gridEl.children.length < need) {
      const card = document.createElement('div');
      card.className = 'ttm-card';
      card.innerHTML = [
        '<div class="ttm-cover">',
          '<img alt="" loading="lazy">',
          '<div class="ttm-dl" title="Скачать">' + SVG.download + '</div>',
          '<div class="ttm-play-badge">' + SVG.play + '</div>',
        '</div>',
        '<div class="ttm-meta"><div class="ttm-title"></div><div class="ttm-author"></div></div>'
      ].join('');
      gridEl.appendChild(card);
    }
    while (gridEl.children.length > need) gridEl.removeChild(gridEl.lastChild);

    for (let i = 0; i < need; i++) {
      const card = gridEl.children[i];
      const t = tracks[i];
      const img = card.querySelector('img');
      const cover = t.cover || '';
      if (cover && img.getAttribute('src') !== cover) img.setAttribute('src', cover);
      if (!cover) img.removeAttribute('src');
      // Умный заголовок: TikTok часто отдаёт "original sound" и имя автора как единственное осмысленное поле
      let title = (t.title || t.name || '').trim();
      const author = (t.author || '').trim();
      if (!title || /^original sound$/i.test(title)) title = author || ('Трек ' + (i + 1));
      card.querySelector('.ttm-title').textContent = title;
      // Автор - не дублируем, если совпадает с заголовком
      card.querySelector('.ttm-author').textContent = (author && author !== title) ? author : '';
      const active = i === state.currentIdx;
      card.classList.toggle('is-playing', active);
      const badge = card.querySelector('.ttm-play-badge');
      if (active && state.playing) badge.innerHTML = SVG.pause;
      else badge.innerHTML = SVG.play;
      card.onclick = () => {
        if (i === state.currentIdx && !audio.paused) audio.pause();
        else playTrack(i);
      };
      const dl = card.querySelector('.ttm-dl');
      dl.onclick = (e) => {
        e.stopPropagation();
        downloadTrack(t, dl);
      };
    }
  }

  async function downloadTrack(t, btn) {
    if (!t || !t.url) return;
    btn.classList.add('is-loading');
    try {
      const res = await fetch(t.url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const ext = /mpeg|mp3/i.test(blob.type) ? 'mp3' : 'm4a';
      const base = (t.title || t.author || t.id || 'track').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = base + '.' + ext;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } catch (err) {
      console.log('[TTM] download err', err);
      btn.classList.add('is-error');
      setTimeout(() => btn.classList.remove('is-error'), 1500);
    } finally {
      btn.classList.remove('is-loading');
    }
  }

  function playTrack(i) {
    if (i < 0 || i >= state.tracks.length) return;
    state.currentIdx = i;
    const t = state.tracks[i];
    buildPlayer();
    playerEl.classList.add('is-open');
    playerEl.querySelector('#ttm-p-title').textContent = t.title || t.name || 'Трек';
    playerEl.querySelector('#ttm-p-author').textContent = t.author || '';
    if (audio.src !== t.url) audio.src = t.url;
    audio.play().catch(() => {});
    renderTracks();
  }

  // ---- секция внутри страницы ----
  function getThreeCol() {
    return document.querySelector('div[class*="DivThreeColumnContainer"]');
  }

  function showMusicSection() {
    buildSection();
    buildPlayer();
    const col = getThreeCol();
    if (!col || !col.parentElement) return;
    if (!sectionEl.parentElement) col.parentElement.appendChild(sectionEl);
    col.style.display = 'none';
    sectionEl.style.display = 'block';
    state.showSection = true;
    // снять выделение с родных вкладок
    document.querySelectorAll('div[class*="DivVideoFeedTab"] [role="tab"]').forEach(el => el.setAttribute('aria-selected', 'false'));
    const ourTab = document.querySelector('.ttm-tab');
    if (ourTab) ourTab.setAttribute('aria-selected', 'true');
    loadTracks();
  }

  function hideMusicSection() {
    if (!state.showSection) return;
    const col = getThreeCol();
    if (col) col.style.display = '';
    if (sectionEl) sectionEl.style.display = 'none';
    if (playerEl) playerEl.classList.remove('is-open');
    if (audio && !audio.paused) audio.pause();
    const ourTab = document.querySelector('.ttm-tab');
    if (ourTab) ourTab.setAttribute('aria-selected', 'false');
    state.showSection = false;
  }

  // ---- таб-бар: вставляем свою кнопку ----
  function findVideoTabBar() {
    return document.querySelector('div[class*="DivVideoFeedTab"]');
  }

  let injected = false;
  function injectTab() {
    if (injected && document.querySelector('.ttm-tab')) return true;
    const bar = findVideoTabBar();
    if (!bar) return false;
    const videoTab = bar.querySelector('[role="tab"][data-e2e="videos-tab"]');
    if (!videoTab) return false;

    const btn = document.createElement('p');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-selected', 'false');
    btn.className = videoTab.className + ' ttm-tab';
    btn.innerHTML = SVG.note + '<span>Музыка</span>';
    btn.onclick = () => showMusicSection();
    btn.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showMusicSection(); } };
    videoTab.parentElement.appendChild(btn);

    // слушаем клики на родные вкладки, чтобы скрыть нашу секцию
    // (флаг на элементе - защита от дублирования при реинжекте)
    if (!bar.__ttmClickListener) {
      bar.__ttmClickListener = true;
      bar.addEventListener('click', (e) => {
        const t = e.target.closest('[role="tab"]');
        if (!t || t.classList.contains('ttm-tab')) return;
        hideMusicSection();
      }, true);
    }

    injected = true;
    return true;
  }

  // ---- secUid + fetch ----
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

  function pushTrack(t) {
    chrome.runtime.sendMessage({ type: 'TTM_SAVE_MANUAL', track: t }, () => {
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
          const a = item.author || {};
          pushTrack({
            id: m.id,
            url: m.playUrl,
            title: m.title || '',
            author: m.authorName || a.nickname || '',
            cover: m.coverMedium || m.coverThumb || a.avatarMedium || '',
            duration: m.duration || 0,
            foundAt: Date.now()
          });
        }
        cursor = data.cursor;
        if (!data.hasMore) break;
      }
    } finally { fetching = false; }
  }

  function loadTracks() {
    chrome.runtime.sendMessage({ type: 'TTM_GET_TRACKS' }, (res) => {
      if (chrome.runtime.lastError) return;
      state.tracks = (res && res.tracks) || [];
      renderTracks();
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'TTM_TRACKS_UPDATED') loadTracks();
  });

  // ---- init: ждём появления таб-бара + следим за SPA-навигацией ----
  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (injectTab()) {
      clearInterval(timer);
      loadTracks();
      fetchFavoriteMusic();
    } else if (tries > 60) {
      clearInterval(timer);
      console.log('[TTM] tab-bar not found, giving up');
    }
  }, 500);

  // При переходах по SPA (Рекомендации → профиль и т.п.) TikTok пересоздаёт
  // таб-бар. MutationObserver возвращает нашу кнопку и восстанавливает секцию.
  let reInjectTimer = null;
  const obs = new MutationObserver(() => {
    if (reInjectTimer) return;
    reInjectTimer = setTimeout(() => {
      reInjectTimer = null;
      const onProfile = /^\/@[^/]+(\/|$)/.test(location.pathname);
      if (!onProfile) {
        // ушли с профиля - гасим плеер и прячем нашу секцию
        if (playerEl) playerEl.classList.remove('is-open');
        if (audio && !audio.paused) audio.pause();
        return;
      }
      // Если таб-бар профиля есть, а нашей кнопки нет - инжектим заново
      const bar = findVideoTabBar();
      const ourTab = document.querySelector('.ttm-tab');
      if (bar && !ourTab) {
        injected = false;
        if (injectTab()) {
          // восстановим состояние секции, если пользователь был на «Музыке»
          if (state.showSection) showMusicSection();
        }
      }
    }, 300);
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
