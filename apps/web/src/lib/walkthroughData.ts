/**
 * Walkthrough data — step-by-step visual guides for manual processes.
 * Each step contains: title, instruction, action type, URL to open, and
 * an HTML mockup (SVG/HTML snippet) with an annotated arrow showing what to click.
 */

export type ActionType = 'navigate' | 'click' | 'type' | 'copy' | 'wait' | 'verify';

export interface WalkthroughStep {
  step: number;
  title: string;
  instruction: string;
  action: ActionType;
  url?: string;                        // Opens in new tab when user clicks "Открыть"
  urlLabel?: string;                   // Label for the open button
  copyText?: string;                   // Text to copy (for action='copy')
  tip?: string;                        // Green tip below the step
  check?: string;                      // What "done" looks like
  mockup: string;                      // HTML string — visual representation with arrow
}

export interface Walkthrough {
  id: string;
  title: string;
  emoji: string;
  description: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: WalkthroughStep[];
}

// ─── Arrow SVG helper ──────────────────────────────────────────────────────
const arrow = (x: string, y: string, rot = 0) =>
  `<g transform="translate(${x},${y}) rotate(${rot})">
    <line x1="0" y1="0" x2="40" y2="0" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    <polygon points="40,0 28,-7 28,7" fill="#ef4444"/>
  </g>`;

const pulse = (cx: string, cy: string) =>
  `<circle cx="${cx}" cy="${cy}" r="12" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="2">
    <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#ef4444"/>`;

// ─── Yandex Webmaster ──────────────────────────────────────────────────────
const yandexWebmaster: Walkthrough = {
  id: 'yandex_webmaster',
  title: 'Яндекс.Вебмастер — верификация сайта',
  emoji: '🔍',
  description: 'Добавьте сайт в Яндекс.Вебмастер для трекинга позиций, индексации и отправки Sitemap.',
  estimatedTime: '~7 минут',
  difficulty: 'easy',
  steps: [
    {
      step: 1,
      title: 'Откройте Яндекс.Вебмастер',
      instruction: 'Перейдите на webmaster.yandex.ru. Убедитесь что вы вошли в аккаунт Яндекса.',
      action: 'navigate',
      url: 'https://webmaster.yandex.ru',
      urlLabel: 'Открыть Яндекс.Вебмастер',
      tip: 'Используйте тот же аккаунт Яндекса, который вы используете для Яндекс.Метрики',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px;background:#1a1a2e">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="0" y="0" width="520" height="38" fill="#1e1e2e" rx="12"/>
        <rect x="12" y="8" width="22" height="22" rx="11" fill="#FF0000" opacity="0.8"/>
        <rect x="42" y="8" width="22" height="22" rx="11" fill="#FFAA00" opacity="0.8"/>
        <rect x="72" y="8" width="22" height="22" rx="11" fill="#00AA00" opacity="0.8"/>
        <rect x="110" y="10" width="300" height="18" rx="9" fill="#2a2a3e"/>
        <text x="260" y="23" text-anchor="middle" font-size="11" fill="#888" font-family="Inter,sans-serif">webmaster.yandex.ru</text>
        <text x="40" y="80" font-size="22" font-weight="bold" fill="#fff" font-family="Inter,sans-serif">Яндекс</text>
        <text x="115" y="80" font-size="22" font-weight="300" fill="rgba(255,255,255,0.7)" font-family="Inter,sans-serif">.Вебмастер</text>
        <rect x="340" y="58" width="140" height="34" rx="8" fill="#FFCC00"/>
        <text x="410" y="80" text-anchor="middle" font-size="13" font-weight="600" fill="#000" font-family="Inter,sans-serif">Войти в аккаунт</text>
        ${arrow('280', '72', 0)}
        ${pulse('338', '75')}
        <text x="40" y="130" font-size="12" fill="#666" font-family="Inter,sans-serif">→ Главная страница Яндекс.Вебмастера</text>
      </svg>`,
    },
    {
      step: 2,
      title: 'Нажмите «Добавить сайт»',
      instruction: 'На главной странице нажмите кнопку «+» или «Добавить сайт» в левом верхнем углу.',
      action: 'click',
      tip: 'Если сайт уже добавлен — перейдите сразу к шагу 4',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="0" y="0" width="160" height="200" fill="#141420"/>
        <text x="20" y="30" font-size="12" font-weight="600" fill="#888" font-family="Inter,sans-serif">МОИ САЙТЫ</text>
        <rect x="16" y="44" width="128" height="36" rx="8" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" stroke-width="1"/>
        <text x="26" y="67" font-size="11" font-weight="700" fill="#818cf8" font-family="Inter,sans-serif">+ Добавить сайт</text>
        ${arrow('155', '62', 180)}
        ${pulse('144', '62')}
        <text x="180" y="80" font-size="14" fill="#666" font-family="Inter,sans-serif">← Нажмите здесь</text>
        <text x="180" y="110" font-size="12" fill="#444" font-family="Inter,sans-serif">Появится поле для ввода домена</text>
      </svg>`,
    },
    {
      step: 3,
      title: 'Введите адрес вашего сайта',
      instruction: 'Введите полный адрес сайта с https:// и нажмите «Добавить».',
      action: 'type',
      tip: 'Обязательно указывайте протокол: https://yoursite.ru (не просто yoursite.ru)',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="40" y="60" width="340" height="44" rx="10" fill="#1e1e2e" stroke="#6366f1" stroke-width="2"/>
        <text x="56" y="88" font-size="13" fill="rgba(255,255,255,0.7)" font-family="Inter,monospace">https://ваш-сайт.ru</text>
        <rect x="395" y="65" width="90" height="34" rx="8" fill="#FFCC00"/>
        <text x="440" y="87" text-anchor="middle" font-size="13" font-weight="600" fill="#000" font-family="Inter,sans-serif">Добавить</text>
        ${arrow('340', '82', 0)}
        ${pulse('393', '82')}
        <text x="40" y="140" font-size="12" fill="#666" font-family="Inter,sans-serif">⌨ Введите адрес → нажмите «Добавить»</text>
      </svg>`,
    },
    {
      step: 4,
      title: 'Выберите способ верификации — HTML-файл',
      instruction: 'Выберите вкладку «HTML-файл». Скачайте файл верификации (яндекс_XXXXXXX.html).',
      action: 'click',
      tip: 'HTML-файл — самый надёжный способ. Если у вас FTP-доступ, OmniIQ загрузит его автоматически через Автопилот',
      check: 'Вы скачали файл вида: yandex_xxxxxxxxxxxxxxxx.html',
      mockup: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="220" fill="#0f0f1a" rx="12"/>
        <text x="30" y="36" font-size="14" font-weight="600" fill="#fff" font-family="Inter,sans-serif">Подтверждение прав на сайт</text>
        <rect x="30" y="50" width="100" height="30" rx="6" fill="#6366f1"/>
        <text x="80" y="70" text-anchor="middle" font-size="12" font-weight="600" fill="#fff" font-family="Inter,sans-serif">HTML-файл</text>
        <rect x="138" y="50" width="100" height="30" rx="6" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="188" y="70" text-anchor="middle" font-size="12" fill="#666" font-family="Inter,sans-serif">Meta-тег</text>
        <rect x="246" y="50" width="100" height="30" rx="6" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="296" y="70" text-anchor="middle" font-size="12" fill="#666" font-family="Inter,sans-serif">DNS</text>
        <rect x="30" y="100" width="440" height="70" rx="8" fill="#141420" stroke="#333" stroke-width="1"/>
        <text x="50" y="122" font-size="11" fill="#888" font-family="Inter,sans-serif">1. Скачайте файл:</text>
        <rect x="50" y="130" width="200" height="26" rx="6" fill="#1e1e2e" stroke="#6366f1" stroke-width="1"/>
        <text x="60" y="148" font-size="11" fill="#818cf8" font-family="monospace">yandex_abc123def456.html</text>
        <rect x="270" y="130" width="120" height="26" rx="6" fill="#FFCC00"/>
        <text x="330" y="148" text-anchor="middle" font-size="11" font-weight="600" fill="#000" font-family="Inter,sans-serif">⬇ Скачать</text>
        ${arrow('390", "143', 0)}
        ${pulse('268', '143')}
      </svg>`,
    },
    {
      step: 5,
      title: 'Загрузите файл в корень сайта',
      instruction: 'Загрузите скачанный файл в корневую папку вашего сайта через FTP или файловый менеджер хостинга. Файл должен быть доступен по адресу: https://yoursite.ru/yandex_XXXXXXX.html',
      action: 'copy',
      tip: 'Используйте вкладку «Автопилот» в OmniIQ — если подключён FTP, мы загрузим файл автоматически',
      check: 'Откройте ссылку https://yoursite.ru/yandex_XXXXXXX.html — должна открыться страница с текстом верификации',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <text x="30" y="36" font-size="13" font-weight="600" fill="#fff" font-family="Inter,sans-serif">📁 Файловый менеджер хостинга</text>
        <rect x="30" y="50" width="220" height="120" rx="8" fill="#141420" stroke="#333" stroke-width="1"/>
        <text x="44" y="74" font-size="11" fill="#888" font-family="monospace">📁 public_html/</text>
        <text x="60" y="94" font-size="11" fill="#666" font-family="monospace">📄 index.html</text>
        <text x="60" y="112" font-size="11" fill="#666" font-family="monospace">📄 robots.txt</text>
        <text x="60" y="130" font-size="11" fill="#10b981" font-family="monospace" font-weight="600">📄 yandex_abc123.html ✓</text>
        <text x="60" y="150" font-size="11" fill="#666" font-family="monospace">📁 css/</text>
        ${pulse('254', '130')}
        <text x="280" y="120" font-size="12" fill="#10b981" font-family="Inter,sans-serif">← Загружен!</text>
        <text x="280" y="140" font-size="11" fill="#666" font-family="Inter,sans-serif">Перетащите сюда</text>
        <text x="280" y="158" font-size="11" fill="#666" font-family="Inter,sans-serif">или загрузите через FTP</text>
      </svg>`,
    },
    {
      step: 6,
      title: 'Нажмите «Проверить» в Яндекс.Вебмастере',
      instruction: 'Вернитесь в Яндекс.Вебмастер и нажмите кнопку «Проверить» — Яндекс обратится по адресу файла и подтвердит права.',
      action: 'click',
      url: 'https://webmaster.yandex.ru',
      urlLabel: 'Вернуться в Вебмастер',
      check: 'Появится сообщение «Права подтверждены» — сайт добавлен',
      tip: 'После верификации сайт начнёт появляться в статистике через 1-3 дня',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="30" y="60" width="440" height="80" rx="12" fill="#141420" stroke="#333" stroke-width="1"/>
        <text x="50" y="90" font-size="13" fill="#888" font-family="Inter,sans-serif">Файл найден. Нажмите «Проверить» для подтверждения.</text>
        <rect x="350" y="100" width="100" height="28" rx="8" fill="#10b981"/>
        <text x="400" y="119" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Inter,sans-serif">Проверить</text>
        ${arrow('290', '114', 0)}
        ${pulse('348', '114')}
      </svg>`,
    },
  ],
};

// ─── Яндекс.Справочник ─────────────────────────────────────────────────────
const yandexSpravochnik: Walkthrough = {
  id: 'yandex_spravochnik',
  title: 'Яндекс.Справочник — добавление компании',
  emoji: '🗺️',
  description: 'Добавьте или обновите карточку компании в Яндекс.Справочнике — она появится в Яндекс.Картах и влияет на ИИ-ответы Алисы.',
  estimatedTime: '~10 минут',
  difficulty: 'easy',
  steps: [
    {
      step: 1,
      title: 'Откройте Яндекс.Бизнес',
      instruction: 'Перейдите на business.yandex.ru (новый интерфейс Справочника). Войдите в аккаунт.',
      action: 'navigate',
      url: 'https://business.yandex.ru',
      urlLabel: 'Открыть Яндекс.Бизнес',
      tip: 'Раньше это назывался Яндекс.Справочник — теперь переименован в Яндекс.Бизнес',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#0f0f1a" rx="12"/>
        <text x="40" y="60" font-size="26" font-weight="700" fill="#FFCC00" font-family="Inter,sans-serif">Яндекс</text>
        <text x="160" y="60" font-size="26" font-weight="300" fill="#fff" font-family="Inter,sans-serif">.Бизнес</text>
        <text x="40" y="88" font-size="13" fill="#888" font-family="Inter,sans-serif">Управляйте присутствием компании на картах и в поиске</text>
        <rect x="40" y="108" width="160" height="36" rx="8" fill="#FFCC00"/>
        <text x="120" y="130" text-anchor="middle" font-size="13" font-weight="700" fill="#000" font-family="Inter,sans-serif">Добавить компанию</text>
        ${arrow('0', '0', 0)}
        ${pulse('200', '126')}
      </svg>`,
    },
    {
      step: 2,
      title: 'Нажмите «Добавить компанию»',
      instruction: 'Нажмите большую кнопку «Добавить компанию» на главном экране.',
      action: 'click',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#0f0f1a" rx="12"/>
        <rect x="40" y="50" width="200" height="80" rx="12" fill="#141420" stroke="#FFCC00" stroke-width="2"/>
        <text x="140" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="#FFCC00" font-family="Inter,sans-serif">+ Добавить компанию</text>
        ${arrow('240', '90', 180)}
        ${pulse('242', '90')}
        <text x="270" y="94" font-size="12" fill="#10b981" font-family="Inter,sans-serif">← Нажмите эту карточку</text>
      </svg>`,
    },
    {
      step: 3,
      title: 'Заполните название и категорию',
      instruction: 'Введите точное название компании и выберите категорию (например: «Ресторан», «Магазин одежды»). Название должно совпадать с тем, что на сайте.',
      action: 'type',
      tip: 'Категория напрямую влияет на то, какие запросы будет показывать Яндекс. Выбирайте максимально точно.',
      mockup: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="220" fill="#0f0f1a" rx="12"/>
        <text x="30" y="35" font-size="12" fill="#888" font-family="Inter,sans-serif">Название компании *</text>
        <rect x="30" y="45" width="440" height="38" rx="8" fill="#1e1e2e" stroke="#6366f1" stroke-width="2"/>
        <text x="46" y="69" font-size="13" fill="rgba(255,255,255,0.8)" font-family="Inter,sans-serif">ООО «Ваша Компания»</text>
        <text x="30" y="110" font-size="12" fill="#888" font-family="Inter,sans-serif">Категория *</text>
        <rect x="30" y="120" width="440" height="38" rx="8" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="46" y="144" font-size="13" fill="#666" font-family="Inter,sans-serif">Начните вводить категорию...</text>
        ${pulse('470', '139')}
        <text x="30" y="185" font-size="11" fill="#10b981" font-family="Inter,sans-serif">💡 Точное название = лучшее ранжирование в поиске</text>
      </svg>`,
    },
    {
      step: 4,
      title: 'Укажите адрес и режим работы',
      instruction: 'Введите точный адрес. Отметьте часы работы каждого дня — Алиса использует эти данные при ответах на вопросы «когда работает».',
      action: 'type',
      tip: 'Укажите часы работы даже если они нестандартные — это критично для голосовых запросов в Алисе',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <text x="30" y="34" font-size="12" fill="#888" font-family="Inter,sans-serif">Адрес</text>
        <rect x="30" y="44" width="440" height="36" rx="8" fill="#1e1e2e" stroke="#6366f1" stroke-width="2"/>
        <text x="46" y="67" font-size="13" fill="rgba(255,255,255,0.8)" font-family="Inter,sans-serif">Москва, ул. Примерная, 1</text>
        <text x="30" y="105" font-size="12" fill="#888" font-family="Inter,sans-serif">Режим работы</text>
        <rect x="30" y="115" width="65" height="26" rx="6" fill="#6366f1"/>
        <text x="62" y="132" text-anchor="middle" font-size="11" fill="#fff" font-family="Inter,sans-serif">Пн</text>
        <rect x="102" y="115" width="65" height="26" rx="6" fill="#6366f1"/>
        <text x="134" y="132" text-anchor="middle" font-size="11" fill="#fff" font-family="Inter,sans-serif">Вт</text>
        <rect x="174" y="115" width="65" height="26" rx="6" fill="#6366f1"/>
        <text x="206" y="132" text-anchor="middle" font-size="11" fill="#fff" font-family="Inter,sans-serif">Ср</text>
        <rect x="246" y="115" width="65" height="26" rx="6" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="278" y="132" text-anchor="middle" font-size="11" fill="#666" font-family="Inter,sans-serif">Сб</text>
        ${pulse('278', '128')}
        <text x="30" y="175" font-size="11" fill="#10b981" font-family="Inter,sans-serif">💡 Алиса использует часы работы для голосовых ответов</text>
      </svg>`,
    },
    {
      step: 5,
      title: 'Добавьте телефон, сайт и фото',
      instruction: 'Заполните телефон, ссылку на сайт и загрузите минимум 3-5 фотографий. Фото увеличивают CTR карточки на 35%.',
      action: 'type',
      tip: 'Загрузите: фасад здания, интерьер, продукты/услуги. Размер от 800×600px',
      check: 'Карточка заполнена на 90%+ — индикатор заполненности в правом верхнем углу',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="30" y="20" width="100" height="70" rx="8" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="80" y="60" text-anchor="middle" font-size="24" font-family="Inter,sans-serif">📷</text>
        <text x="80" y="78" text-anchor="middle" font-size="10" fill="#666" font-family="Inter,sans-serif">Добавить</text>
        <rect x="140" y="20" width="100" height="70" rx="8" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="190" y="60" text-anchor="middle" font-size="24" font-family="Inter,sans-serif">📷</text>
        <text x="190" y="78" text-anchor="middle" font-size="10" fill="#666" font-family="Inter,sans-serif">Добавить</text>
        <rect x="250" y="20" width="100" height="70" rx="8" fill="#1e1e2e" stroke="#333" stroke-width="1"/>
        <text x="300" y="60" text-anchor="middle" font-size="24" font-family="Inter,sans-serif">📷</text>
        ${pulse('300', '55')}
        <text x="30" y="120" font-size="12" fill="#888" font-family="Inter,sans-serif">Телефон</text>
        <rect x="30" y="130" width="200" height="32" rx="8" fill="#1e1e2e" stroke="#6366f1" stroke-width="2"/>
        <text x="46" y="151" font-size="13" fill="rgba(255,255,255,0.8)" font-family="Inter,monospace">+7 (999) 123-45-67</text>
        <text x="30" y="185" font-size="11" fill="#f59e0b" font-family="Inter,sans-serif">📸 Минимум 3 фото для лучшего ранжирования</text>
      </svg>`,
    },
    {
      step: 6,
      title: 'Отправьте на модерацию',
      instruction: 'Нажмите «Сохранить» или «Отправить». Модерация занимает 1-3 рабочих дня. После одобрения карточка появится на Яндекс.Картах.',
      action: 'click',
      check: 'Статус карточки: «На проверке» — ждите 1-3 дня',
      tip: 'OmniIQ начнёт трекать вашу карточку Яндекс.Справочника автоматически после появления',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#0f0f1a" rx="12"/>
        <rect x="30" y="50" width="440" height="80" rx="12" fill="#141420" stroke="#10b981" stroke-width="1"/>
        <text x="50" y="82" font-size="13" fill="#fff" font-family="Inter,sans-serif">Всё заполнено. Карточка готова к отправке.</text>
        <text x="50" y="102" font-size="12" fill="#888" font-family="Inter,sans-serif">Модерация: 1-3 рабочих дня</text>
        <rect x="330" y="110" width="120" height="32" rx="8" fill="#10b981"/>
        <text x="390" y="130" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Inter,sans-serif">Отправить ✓</text>
        ${arrow('270", "126', 0)}
        ${pulse('328', '126')}
      </svg>`,
    },
  ],
};

// ─── Wikidata entity ───────────────────────────────────────────────────────
const wikidata: Walkthrough = {
  id: 'wikidata',
  title: 'Wikidata — создание карточки компании',
  emoji: '🌐',
  description: 'Создайте entity вашей компании в Wikidata — ИИ-модели (GigaChat, Алиса, ChatGPT) используют Wikidata как источник знаний.',
  estimatedTime: '~15 минут',
  difficulty: 'medium',
  steps: [
    {
      step: 1,
      title: 'Зарегистрируйтесь или войдите в Wikidata',
      instruction: 'Перейдите на wikidata.org. Нажмите «Log in» → «Create account» если нет аккаунта. Используйте реальный email.',
      action: 'navigate',
      url: 'https://www.wikidata.org/wiki/Special:CreateAccount',
      urlLabel: 'Создать аккаунт Wikidata',
      tip: 'Аккаунт нужен для создания и редактирования записей. Регистрация бесплатная',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#f8f9fa" rx="12"/>
        <text x="30" y="40" font-size="20" font-weight="700" fill="#006699" font-family="serif">Wikidata</text>
        <rect x="360" y="20" width="100" height="28" rx="4" fill="#006699"/>
        <text x="410" y="38" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">Log in</text>
        <rect x="360" y="54" width="100" height="28" rx="4" fill="#36c"/>
        <text x="410" y="72" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">Create account</text>
        ${arrow('310', '68', 0)}
        ${pulse('358', '68')}
        <text x="30" y="110" font-size="13" fill="#333" font-family="sans-serif">Свободная база знаний. Используется ИИ по всему миру.</text>
      </svg>`,
    },
    {
      step: 2,
      title: 'Создайте новый элемент',
      instruction: 'В меню слева нажмите «Create a new item» (Создать новый элемент).',
      action: 'navigate',
      url: 'https://www.wikidata.org/wiki/Special:NewItem',
      urlLabel: 'Создать новый элемент',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#f8f9fa" rx="12"/>
        <rect x="0" y="0" width="160" height="180" fill="#eaecf0" rx="12"/>
        <text x="16" y="40" font-size="11" fill="#54595d" font-family="sans-serif">Wikidata</text>
        <text x="16" y="65" font-size="11" fill="#36c" font-family="sans-serif">Main Page</text>
        <text x="16" y="85" font-size="11" fill="#36c" font-family="sans-serif">Recent changes</text>
        <text x="16" y="105" font-size="11" fill="#36c" font-family="sans-serif" font-weight="bold" text-decoration="underline">Create new item</text>
        <text x="16" y="125" font-size="11" fill="#36c" font-family="sans-serif">Random item</text>
        ${arrow('160", "105', 180)}
        ${pulse('158', '105')}
        <text x="180" y="109" font-size="12" fill="#006699" font-family="sans-serif">← Нажмите здесь</text>
      </svg>`,
    },
    {
      step: 3,
      title: 'Заполните метку и описание',
      instruction: 'Выберите язык «ru». Введите название компании в поле «Label» (Метка) и краткое описание в «Description» (1-2 предложения).',
      action: 'type',
      tip: 'Описание: «российская компания, [сфера деятельности], основана в [год]». Чем точнее — тем лучше ИИ понимает кто вы.',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#f8f9fa" rx="12"/>
        <text x="30" y="36" font-size="14" font-weight="600" fill="#333" font-family="sans-serif">Create a new item</text>
        <text x="30" y="60" font-size="12" fill="#54595d" font-family="sans-serif">Language:</text>
        <rect x="110" y="48" width="60" height="24" rx="4" fill="#fff" stroke="#a2a9b1" stroke-width="1"/>
        <text x="140" y="64" text-anchor="middle" font-size="12" fill="#333" font-family="sans-serif">ru</text>
        <text x="30" y="100" font-size="12" fill="#54595d" font-family="sans-serif">Label (Метка):</text>
        <rect x="30" y="108" width="440" height="30" rx="4" fill="#fff" stroke="#36c" stroke-width="2"/>
        <text x="44" y="128" font-size="12" fill="#333" font-family="sans-serif">ООО «Ваша Компания»</text>
        <text x="30" y="160" font-size="12" fill="#54595d" font-family="sans-serif">Description (Описание):</text>
        <rect x="30" y="168" width="440" height="30" rx="4" fill="#fff" stroke="#a2a9b1" stroke-width="1"/>
        <text x="44" y="188" font-size="11" fill="#666" font-family="sans-serif">российская компания в сфере...</text>
        ${pulse('470', '123')}
      </svg>`,
    },
    {
      step: 4,
      title: 'Добавьте ключевые утверждения',
      instruction: 'После создания добавьте утверждения (Statements): P31 (является) = Q4830453 (бизнес), P856 (официальный сайт) = ссылка, P17 (страна) = Q159 (Россия).',
      action: 'click',
      tip: 'P31 + P856 + P17 — минимальный набор для того, чтобы ИИ правильно идентифицировал вашу компанию',
      copyText: 'P31: Q4830453 | P856: ваш-сайт.ru | P17: Q159',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#f8f9fa" rx="12"/>
        <rect x="30" y="20" width="440" height="36" rx="6" fill="#eaecf0"/>
        <text x="46" y="41" font-size="12" fill="#54595d" font-family="sans-serif" font-weight="600">является (P31)</text>
        <text x="250" y="41" font-size="12" fill="#36c" font-family="sans-serif">бизнес (Q4830453)</text>
        <rect x="30" y="64" width="440" height="36" rx="6" fill="#eaecf0"/>
        <text x="46" y="85" font-size="12" fill="#54595d" font-family="sans-serif" font-weight="600">официальный сайт (P856)</text>
        <text x="250" y="85" font-size="12" fill="#36c" font-family="sans-serif">https://ваш-сайт.ru</text>
        <rect x="30" y="108" width="440" height="36" rx="6" fill="#fff3cd"/>
        <text x="46" y="129" font-size="12" fill="#54595d" font-family="sans-serif" font-weight="600">страна (P17)</text>
        <text x="250" y="129" font-size="12" fill="#36c" font-family="sans-serif">Россия (Q159)</text>
        ${pulse('475", "129')}
        <text x="46" y="170" font-size="11" fill="#36c" font-family="sans-serif">+ добавить утверждение</text>
        ${arrow('150", "165', 180)}
      </svg>`,
    },
    {
      step: 5,
      title: 'Сохраните и скопируйте Q-идентификатор',
      instruction: 'Нажмите «Save». Скопируйте Q-идентификатор вашей записи (например Q123456789). Добавьте его в OmniIQ в разделе «База знаний».',
      action: 'copy',
      check: 'Запись создана. У неё есть URL вида: wikidata.org/wiki/Q123456789',
      tip: 'После сохранения запись проиндексируется ИИ-моделями в течение 2-4 недель',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#f8f9fa" rx="12"/>
        <text x="30" y="36" font-size="18" font-weight="700" fill="#006699" font-family="sans-serif">Q123456789</text>
        <text x="30" y="58" font-size="13" fill="#333" font-family="sans-serif">ООО «Ваша Компания»</text>
        <text x="30" y="76" font-size="12" fill="#666" font-family="sans-serif">российская компания в сфере...</text>
        <rect x="30" y="100" width="160" height="30" rx="6" fill="#36c"/>
        <text x="110" y="119" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">📋 Скопировать Q-ID</text>
        ${arrow('192", "115', 180)}
        ${pulse('190', '115')}
        <text x="210" y="119" font-size="12" fill="#006699" font-family="sans-serif">← Скопируйте в OmniIQ</text>
      </svg>`,
    },
  ],
};

// ─── 2ГИС ──────────────────────────────────────────────────────────────────
const twoGis: Walkthrough = {
  id: '2gis',
  title: '2ГИС — добавление/обновление компании',
  emoji: '📍',
  description: 'Добавьте компанию в 2ГИС — второй по популярности справочник в России, особенно важен в регионах.',
  estimatedTime: '~8 минут',
  difficulty: 'easy',
  steps: [
    {
      step: 1,
      title: 'Откройте Личный кабинет 2ГИС',
      instruction: 'Перейдите на cabinet.2gis.ru — это бесплатный инструмент для управления карточкой компании.',
      action: 'navigate',
      url: 'https://cabinet.2gis.ru',
      urlLabel: 'Открыть кабинет 2ГИС',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#0f2a4a" rx="12"/>
        <rect x="30" y="30" width="80" height="36" rx="8" fill="#29a8e0"/>
        <text x="70" y="53" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="sans-serif">2ГИС</text>
        <text x="30" y="90" font-size="18" font-weight="600" fill="#fff" font-family="sans-serif">Кабинет для бизнеса</text>
        <text x="30" y="112" font-size="13" fill="rgba(255,255,255,0.7)" font-family="sans-serif">Управляйте своей карточкой бесплатно</text>
        <rect x="30" y="130" width="160" height="32" rx="8" fill="#29a8e0"/>
        <text x="110" y="150" text-anchor="middle" font-size="13" font-weight="600" fill="#fff" font-family="sans-serif">Добавить компанию</text>
        ${pulse('192', '146')}
      </svg>`,
    },
    {
      step: 2,
      title: 'Найдите или создайте карточку',
      instruction: 'Введите название компании в поиск. Если компания уже есть — нажмите «Это моя компания». Если нет — «Добавить новую».',
      action: 'type',
      tip: 'Многие компании уже есть в 2ГИС — проверьте перед созданием новой',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f2a4a" rx="12"/>
        <rect x="30" y="40" width="380" height="38" rx="10" fill="rgba(255,255,255,0.1)" stroke="#29a8e0" stroke-width="2"/>
        <text x="50" y="64" font-size="13" fill="rgba(255,255,255,0.6)" font-family="sans-serif">Название вашей компании...</text>
        <rect x="30" y="96" width="440" height="44" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="50" y="118" font-size="13" fill="#fff" font-family="sans-serif">ООО «Ваша Компания»</text>
        <text x="50" y="134" font-size="11" fill="rgba(255,255,255,0.5)" font-family="sans-serif">ул. Примерная, 1 · Москва</text>
        <rect x="360" y="104" width="100" height="28" rx="6" fill="#29a8e0"/>
        <text x="410" y="122" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="sans-serif">Это моя</text>
        ${arrow('300", "118', 0)}
        ${pulse('358', '118')}
      </svg>`,
    },
    {
      step: 3,
      title: 'Заполните и обновите данные',
      instruction: 'Обновите телефон, сайт, часы работы, описание. Добавьте фото. Нажмите «Сохранить».',
      action: 'type',
      check: 'Карточка обновлена. Изменения появятся на картах через 1-2 дня.',
      tip: 'Фото фасада + логотип + интерьер = полная карточка. Компании с фото получают на 40% больше просмотров',
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f2a4a" rx="12"/>
        <text x="30" y="36" font-size="13" fill="rgba(255,255,255,0.6)" font-family="sans-serif">Телефон</text>
        <rect x="30" y="44" width="200" height="32" rx="6" fill="rgba(255,255,255,0.08)" stroke="#29a8e0" stroke-width="2"/>
        <text x="46" y="65" font-size="13" fill="#fff" font-family="monospace">+7 (999) 123-45-67</text>
        <text x="250" y="36" font-size="13" fill="rgba(255,255,255,0.6)" font-family="sans-serif">Сайт</text>
        <rect x="250" y="44" width="240" height="32" rx="6" fill="rgba(255,255,255,0.08)" stroke="#333" stroke-width="1"/>
        <text x="266" y="65" font-size="13" fill="rgba(255,255,255,0.5)" font-family="sans-serif">https://ваш-сайт.ru</text>
        <rect x="30" y="130" width="440" height="36" rx="8" fill="#29a8e0"/>
        <text x="250" y="153" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="sans-serif">Сохранить изменения</text>
        ${arrow('0', '0', 0)}
        ${pulse('470', '148')}
      </svg>`,
    },
  ],
};

// ─── Schema.org разметка ───────────────────────────────────────────────────
const schemaOrg: Walkthrough = {
  id: 'schema_org',
  title: 'Schema.org — добавление разметки организации',
  emoji: '🏗️',
  description: 'Добавьте JSON-LD разметку Schema.org на сайт — она помогает ИИ понять кто вы, чем занимаетесь и где находитесь.',
  estimatedTime: '~5 минут',
  difficulty: 'medium',
  steps: [
    {
      step: 1,
      title: 'Скопируйте сгенерированный код',
      instruction: 'OmniIQ уже сгенерировал для вас Schema.org разметку на основе данных вашего сайта. Нажмите «Скопировать» ниже.',
      action: 'copy',
      tip: 'JSON-LD — рекомендованный Google и Яндексом формат. Не требует изменений в HTML-структуре страницы',
      copyText: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ваша Компания",
  "url": "https://ваш-сайт.ru",
  "logo": "https://ваш-сайт.ru/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+7-999-123-45-67",
    "contactType": "customer service"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Москва",
    "addressCountry": "RU"
  }
}
</script>`,
      mockup: `<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="200" fill="#0f0f1a" rx="12"/>
        <rect x="30" y="20" width="440" height="130" rx="8" fill="#141420" stroke="#333" stroke-width="1"/>
        <text x="46" y="45" font-size="10" fill="#818cf8" font-family="monospace">&lt;script type="application/ld+json"&gt;</text>
        <text x="46" y="63" font-size="10" fill="#22d3ee" font-family="monospace">  "@type": "Organization",</text>
        <text x="46" y="79" font-size="10" fill="#10b981" font-family="monospace">  "name": "Ваша Компания",</text>
        <text x="46" y="95" font-size="10" fill="#10b981" font-family="monospace">  "url": "https://ваш-сайт.ru",</text>
        <text x="46" y="111" font-size="10" fill="#f59e0b" font-family="monospace">  "address": { ... },</text>
        <text x="46" y="127" font-size="10" fill="#818cf8" font-family="monospace">&lt;/script&gt;</text>
        <rect x="340" y="160" width="130" height="30" rx="8" fill="#6366f1"/>
        <text x="405" y="179" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Inter,sans-serif">📋 Скопировать</text>
        ${arrow('270", "175', 0)}
        ${pulse('338', '175')}
      </svg>`,
    },
    {
      step: 2,
      title: 'Вставьте в &lt;head&gt; вашего сайта',
      instruction: 'Откройте редактор кода вашего сайта (или CMS). Вставьте скопированный код перед закрывающим тегом </head>.',
      action: 'type',
      tip: 'В WordPress: Appearance → Theme Editor → header.php, или используйте плагин Insert Headers and Footers',
      check: 'Проверьте через schema.org/validator — код должен отображать вашу организацию',
      mockup: `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="220" fill="#1e1e1e" rx="12"/>
        <text x="30" y="36" font-size="11" fill="#608b4e" font-family="monospace">&lt;!-- head section --&gt;</text>
        <text x="30" y="56" font-size="11" fill="#9cdcfe" font-family="monospace">&lt;meta charset="UTF-8"&gt;</text>
        <text x="30" y="76" font-size="11" fill="#9cdcfe" font-family="monospace">&lt;title&gt;Ваш сайт&lt;/title&gt;</text>
        <rect x="26" y="90" width="450" height="60" rx="4" fill="rgba(99,102,241,0.12)" stroke="#6366f1" stroke-width="1"/>
        <text x="36" y="110" font-size="10" fill="#818cf8" font-family="monospace">&lt;script type="application/ld+json"&gt;</text>
        <text x="36" y="128" font-size="10" fill="#10b981" font-family="monospace">  { "@type": "Organization", "name": "..." }</text>
        <text x="36" y="144" font-size="10" fill="#818cf8" font-family="monospace">&lt;/script&gt;</text>
        <text x="30" y="175" font-size="11" fill="#9cdcfe" font-family="monospace">&lt;/head&gt;</text>
        ${pulse('470", "120')}
        <text x="30" y="200" font-size="10" fill="#10b981" font-family="monospace">↑ Вставьте сюда, перед &lt;/head&gt;</text>
      </svg>`,
    },
    {
      step: 3,
      title: 'Проверьте разметку',
      instruction: 'Откройте валидатор Schema.org и введите URL вашего сайта. Убедитесь что Organization отображается без ошибок.',
      action: 'navigate',
      url: 'https://validator.schema.org',
      urlLabel: 'Открыть валидатор',
      check: 'Валидатор показывает тип "Organization" без красных ошибок',
      tip: 'Жёлтые предупреждения допустимы. Красные ошибки нужно исправить.',
      mockup: `<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;border-radius:12px">
        <rect width="520" height="180" fill="#fff" rx="12"/>
        <text x="30" y="36" font-size="14" font-weight="600" fill="#1a73e8" font-family="sans-serif">Schema Markup Validator</text>
        <rect x="30" y="50" width="340" height="34" rx="6" fill="#f8f9fa" stroke="#dadce0" stroke-width="1"/>
        <text x="46" y="72" font-size="12" fill="#5f6368" font-family="sans-serif">https://ваш-сайт.ru</text>
        <rect x="380" y="54" width="100" height="26" rx="6" fill="#1a73e8"/>
        <text x="430" y="71" text-anchor="middle" font-size="12" fill="#fff" font-family="sans-serif">Run test</text>
        <rect x="30" y="105" width="440" height="50" rx="6" fill="#e8f5e9" stroke="#4caf50" stroke-width="1"/>
        <text x="50" y="127" font-size="12" fill="#2e7d32" font-family="sans-serif">✓ Organization — detected</text>
        <text x="50" y="145" font-size="11" fill="#388e3c" font-family="sans-serif">No errors · 2 warnings</text>
        ${pulse('470', '130')}
      </svg>`,
    },
  ],
};

// ─── Export all walkthroughs ───────────────────────────────────────────────
export const WALKTHROUGHS: Record<string, Walkthrough> = {
  yandex_webmaster: yandexWebmaster,
  yandex_spravochnik: yandexSpravochnik,
  wikidata,
  '2gis': twoGis,
  schema_org: schemaOrg,
};

// Recommendation key → walkthrough ID mapping
export const REC_TO_WALKTHROUGH: Record<string, string> = {
  'yandex_webmaster_verify': 'yandex_webmaster',
  'yandex_webmaster_sitemap': 'yandex_webmaster',
  'yandex_spravochnik': 'yandex_spravochnik',
  'yandex_directory': 'yandex_spravochnik',
  'wikidata_entity': 'wikidata',
  'wikidata': 'wikidata',
  '2gis': '2gis',
  '2gis_profile': '2gis',
  'schema_org': 'schema_org',
  'schema_org_organization': 'schema_org',
  'schema_markup': 'schema_org',
};
