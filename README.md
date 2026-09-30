# TikTok Music Overlay

Chrome-расширение (MV3), которое добавляет на страницу профиля TikTok **встроенную вкладку «Музыка»** — плеер для треков, сохранённых в «Избранном» в TikTok Studio. В ПК-версии TikTok такой вкладки нет.

---

## Возможности

- Вкладка **«🎵 Музыка»** в таб-баре профиля, рядом с «Видео / Репосты / Избранное / Лайкнул(-а)».
- Сетка карточек треков (обложка, название, автор) в стиле TikTok.
- Закреплённый снизу плеер: play/pause, prev/next, seek, громкость, автопереход к следующему.
- Инкрементальная загрузка: треки появляются по мере поступления из API.
- Кнопка **«Скачать»** на карточке (fetch → blob → `<a download>`).
- Автовосстановление вкладки при SPA-навигации (Рекомендации → профиль и т.п.).

---

## Установка (dev)

1. `chrome://extensions` → включить **Режим разработчика**.
2. **Загрузить распакованное расширение** → выбрать корень репозитория.
3. Открыть `https://www.tiktok.com/@<твой_ник>`.
4. После изменений кода: ⟳ в `chrome://extensions` → F5 на странице TikTok.
   > Если в консоли `Extension context invalidated` — просто перезагрузи вкладку.

---

## Структура

```
manifest.json            MV3-манифест
src/
  background.js          service worker: хранилище треков + очередь записи
  content-profile.js     content script для https://www.tiktok.com/@*
  content-studio.js      content script для TikTok Studio (резервный сбор)
  overlay.css            стили вкладки, карточек и плеера
icons/
  icon16.png icon32.png icon48.png icon128.png
```

---

## API

### Эндпоинт «Избранное» в Studio

```
GET https://www.tiktok.com/api/user/collect/music_list/
    ?secUid=<SECUID>
    &appId=1988
    &cursor=<CURSOR>
    &count=20
    &aid=1988
```

- `credentials: 'include'` обязателен — эндпоинт требует сессионные cookie.
- Пагинация: ответ содержит `cursor` и `hasMore`. Идём в цикле, пока `hasMore === true`.
- `secUid` пользователя: `MS4wLjABAAAAmhZ9pycz8B_BSMsNk3jFyxFwD8ONWmTbsXUScjDM5uHJahdPOaahwXZwgbyDmRdo` (это для `@ygandosheni`, у других — свой).

#### Ответ

```jsonc
{
  "musicList": [
    {
      "author": {                       // автор видео, в котором звук использован
        "id": "7450537715114198059",
        "nickname": "Lindsey °❀⋆.ೃ࿔*:･",
        "uniqueId": "11037lindsey",
        "secUid": "MS4wLjABAAAA...",
        "avatarMedium": "https://p16-common-sign.tiktokcdn.com/..."
      },
      "music": {
        "id": "7671774088888716062",
        "title": "original sound",        // часто "original sound" — бесполезно
        "authorName": "Lindsey °❀⋆.ೃ࿔*:･",
        "coverMedium": "https://p16-common-sign.tiktokcdn.com/...",  // может быть пустым
        "coverThumb":  "https://p19-common-sign.tiktokcdn.com/...",
        "coverLarge":  "https://p16-common-sign.tiktokcdn.com/...",
        "playUrl": "https://v16m.tiktokcdn.com/.../video/tos/...?mime_type=audio_mpeg&...",
        "duration": 42,                    // секунды
        "original": true,
        "private": false,
        "isCopyrighted": false
      },
      "stats": { "videoCount": 619 }
    }
  ],
  "cursor": 1790110848,
  "hasMore": true
}
```

#### Поля трека, которые используем

| Поле                | Источник                          | Примечание |
|---------------------|-----------------------------------|------------|
| `id`                | `music.id`                       | Стабильный идентификатор, дедуп по нему |
| `url`               | `music.playUrl`                  | **Подписанный, временный** (см. ниже) |
| `title`             | `music.title`                    | Часто `"original sound"` |
| `author`            | `music.authorName` → `author.nickname` | Fallback |
| `cover`             | `music.coverMedium` → `coverThumb` → `author.avatarMedium` | Каскад |
| `duration`          | `music.duration`                 | Секунды |

---

### ⚠️ Ограничения API (важно!)

1. **Нет сортировки.** API не принимает параметр сортировки и не возвращает дату добавления.
   Проверены варианты `sortType=1|2`, `cursor_desc=1`, `sort=create_time` — все возвращают **тот же порядок** и **тот же набор полей**.

2. **Порядок API = порядок в UI Studio.** Проверено сравнением первых 10 `id` из DOM панели «Избранное» и из ответа API — совпадают 1:1. Studio **не пересортировывает**.

   → Следствие: «свежие сверху» воспроизвести нельзя, потому что сами TikTok-данные не содержат времени. Единственный корректный порядок — тот, что отдаёт API.

3. **`playUrl` истекает.** Это подписанный URL с `x-expires` (обычно ~24 часа). Сохранённые ссылки через день перестают играть → нужен периодический перезапрос списка, чтобы обновить `playUrl` на месте (дедуп по `id`).

4. **`title` часто бесполезен.** У большинства «оригинальных звуков» `music.title = "original sound"`. В UI используем fallback: `title` → `author` → `Трек N`.

5. **`coverMedium` может быть пустым.** Каскад: `coverMedium` → `coverThumb` → `author.avatarMedium`.

---

## Внутренняя архитектура

### Хранилище

Все треки лежат в `chrome.storage.local` под ключом `ttm_tracks`:

```ts
type Track = {
  id: string;          // music.id
  url: string;         // music.playUrl (подписанный, временный)
  title: string;
  author: string;
  cover: string;
  duration: number;
  foundAt: number;     // Date.now() момента первого сохранения
};
```

Лимит — **500 треков** (обрезается хвост).

### Очередь записи (background.js)

`serialize(fn)` — все записи в `chrome.storage.local` идут через одну promise-цепочку. Без этого параллельные `saveOne` делают `read-modify-write` гонкой и перетирают друг друга.

`upsertPreserveOrder(list, track)`:
- ищет трек по `id` (fallback — по `url`);
- если найден и что-то изменилось — **обновляет на месте** (не перескакивает в конец, чтобы обновлённый `playUrl` не сбивал порядок);
- если не найден — `push` в конец.

> ⚠️ **Не используй `unshift`** для новых треков — при поштучной отправке из `content-profile.js` порядок переворачивается.

### Обмен сообщениями

| Сообщение             | Направление       | Payload                    | Ответ |
|-----------------------|-------------------|----------------------------|-------|
| `TTM_GET_TRACKS`     | content → bg      | —                          | `{ tracks: Track[] }` |
| `TTM_CLEAR_TRACKS`   | content → bg      | —                          | `{ ok: true }` |
| `TTM_SAVE_MANY`      | content → bg      | `{ tracks: Track[] }`     | `{ ok: true }` |
| `TTM_SAVE_MANUAL`    | content → bg      | `{ track: Track }`        | `{ ok: true }` |
| `TTM_TRACKS_UPDATED` | bg → all tabs     | —                          | — |

### UI (content-profile.js)

- `buildSection()` — секция со сеткой карточек.
- `buildPlayer()` — закреплённый снизу плеер, живёт в `document.body`.
- `injectTab()` — добавляет `<p role="tab">` в таб-бар профиля (`div[class*="DivVideoFeedTab"]`).
- `showMusicSection()` / `hideMusicSection()` — прячут родной `div[class*="DivThreeColumnContainer"]` и показывают свою секцию (и наоборот).
- `MutationObserver` на `document.body` возвращает вкладку при SPA-пересоздании DOM.

### Селекторы TikTok (могут ломаться при редизайне)

| Что                       | Селектор |
|---------------------------|----------|
| Таб-бар вкладок профиля   | `div[class*="DivVideoFeedTab"]` |
| Активная вкладка          | `[role="tab"][aria-selected="true"]` |
| Родной контейнер контента | `div[class*="DivThreeColumnContainer"]` |
| Вкладка «Видео»           | `[role="tab"][data-e2e="videos-tab"]` |

---

## Известные ограничения

- **Сортировка «как в Studio»** технически невозможна — API не отдаёт время добавления (см. выше).
- **`playUrl` протухает** через ~24 ч. Нужно периодически открывать профиль/жать «Обновить», чтобы перезаписать ссылки.
- **Публикация в Chrome Web Store** с кнопкой «Скачать» невозможна: магазин запрещает расширения, качающие аудио с TikTok/YouTube/VK. Для публикации надо убрать кнопку.

---

## Лицензия

Apache License 2.0 — см. [LICENSE](LICENSE).
