import re

file_path = r'f:\документы\Загрузки2025\antigravity\OmniIQ\apps\landing\ru\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    '<html lang="en">': '<html lang="ru">',
    'Next-Generation Visibility Platform': 'Платформа нового поколения',
    'Be found on Google.<br/>': 'Клиенты ищут вас в Яндексе и Алисе.<br/>',
    'Be found by AI.<br/>': 'Они находят конкурентов.<br/>',
    'One score. One platform.': 'Один балл. Одна платформа.',
    'OmniIQ tracks your business across <strong>search engines, AI assistants, and knowledge graphs</strong> — gives you a single Visibility Score, and tells you exactly what to fix. Free for 7 days.': 'OmniIQ измеряет вашу видимость в поисковиках и ИИ-ассистентах, находит почему вас не находят — и говорит точно что исправить. 7 дней бесплатно.',
    'SEO &amp; Search': 'Яндекс Поиск',
    'AI Models': 'Алиса & GigaChat',
    'Knowledge Graphs': 'Яндекс.Карты & 2ГИС',
    'https://yourcompany.com': 'ваш-сайт.ru',
    'Get Free Score &rarr;': 'Узнать свой балл бесплатно &rarr;',
    '✓ Free for 7 days': '✓ 7 дней бесплатно',
    '✓ No credit card': '✓ Без карты',
    '✓ Real data, no demo': '✓ Реальные данные, не демо',
    'How it works': 'Как работает',
    'Pricing': 'Тарифы',
    'Why OmniIQ': 'Почему мы',
    'Start Free Trial &rarr;': 'Начать бесплатно &rarr;',
    'Recognize yourself?': 'Узнаёте себя?',
    'You have a website, but search brings no calls': 'Сайт есть, а звонков из поиска нет',
    'You rank on page 3 while competitors take page 1. Your customers cannot find you.': 'Яндекс не показывает вас по нужным запросам, хотя конкуренты на первой странице.',
    'AI assistants recommend competitors': 'Алиса советует конкурентов',
    "ChatGPT and voice assistants don't know you exist when customers ask for recommendations.": 'Голосовые помощники и ИИ-чаты не знают о вашей компании.',
    'Paying agencies with zero transparent results': 'Платите агентству, результата нет',
    "Getting 50-page monthly reports but traffic is flat and you don't know what to do next.": 'Ежемесячные отчёты на 50 страниц, но позиции не растут и непонятно что делать.',
    'Your Visibility Score in 60 Seconds': 'Ваш Балл Видимости за 60 секунд',
    'Drop your domain and get an instant audit across all channels.': 'Укажите домен и получите мгновенный аудит по всем каналам.',
    'Visibility Score': 'Балл видимости',
    'Google Search': 'Яндекс Поиск',
    'Google Maps': 'Яндекс.Карты',
    'Apple Maps': '2ГИС',
    'ChatGPT': 'Алиса',
    'Perplexity': 'GigaChat',
    'Schema.org': 'Schema.org',
    'SSL/HTTPS': 'SSL/HTTPS',
    'Your 7-Day Free Journey': 'Ваши 7 дней бесплатно',
    'Day 1': 'День 1',
    'Day 3': 'День 3',
    'Day 5': 'День 5',
    'Day 7': 'День 7',
    'Baseline Score': 'Базовый балл',
    'You get an exact diagnosis of your visibility.': 'Получаете точный диагноз видимости.',
    'First Report': 'Первый отчёт',
    'You see exactly what is holding you back.': 'Видите что мешает вам расти.',
    'Score Goes Up': 'Балл растёт',
    'Early improvements start working immediately.': 'Первые улучшения уже работают.',
    'The Decision': 'Решение',
    'Stay with us for $49/mo or keep the baseline.': 'Остаться с нами за 1490 ₽/мес или уйти.',
    'Four Engines. One Score.': 'Четыре движка. Один балл.',
    'The Knowledge Engine': 'Движок знаний',
    'Reads your site, extracts key facts, and builds a structured entity graph.': 'Читает сайт, извлекает факты и строит базу знаний о вас.',
    'The Signal Engine': 'Сигнальный движок',
    '15+ daily checks across Google, ChatGPT, Maps, and Wikidata.': 'Ежедневные проверки в Яндексе, Алисе, GigaChat и 2ГИС.',
    'The Decision Engine': 'Движок решений',
    'GPT-4o analyzes gaps and generates a prioritized action plan.': 'GPT-4o анализирует разрывы и генерирует приоритетный план.',
    'The Execution Engine': 'Движок исполнения',
    'Tracks every action and measures its exact impact on your score.': 'Отслеживает каждое действие и измеряет его влияние на балл.',
    'See exactly what moves your score': 'Видите точно что двигает ваш балл',
    'Score Dynamics': 'Динамика балла',
    'Track your growth with automated annotations.': 'Трекинг роста с аннотациями.',
    'Priority Actions': 'Список действий',
    'Clear, prioritized list of what to fix today.': 'Чёткий план того, что исправить сегодня.',
    'AI Mentions': 'Трекер упоминаний',
    'Track when ChatGPT and Perplexity mention you.': 'Отслеживайте упоминания в Алисе и GigaChat.',
    'Quick Wins': 'Быстрые победы',
    'Issues fixed automatically by the platform.': 'Действия, выполненные платформой автоматически.',
    'OmniIQ vs. Traditional SEO': 'OmniIQ vs Традиционное SEO',
    'Traditional Tools': 'Традиционные инструменты',
    'Fragmented SEO tools': 'Разрозненные SEO-инструменты',
    'No AI visibility tracking': 'Нет трекинга видимости в ИИ',
    'No Entity/Knowledge graph focus': 'Нет работы с Entity и базами знаний',
    'Raw data without action plans': 'Сырые данные без плана действий',
    'OmniIQ Platform': 'Платформа OmniIQ',
    'Unified visibility platform': 'Единая платформа видимости',
    'Full AI visibility tracking': 'Полный трекинг видимости в ИИ',
    'Entity & Wikidata optimization': 'Оптимизация Entity и Wikidata',
    'GPT-4o prioritized action plans': 'GPT-4o план приоритетных действий',
    'For SEO Agencies: Automate the Routine': 'Для SEO-агентств: автоматизируйте рутину',
    'Multi-domain dashboard': 'Мультидоменный дашборд',
    'All your clients in one single view.': 'Все ваши клиенты на одном экране.',
    'White-label reports': 'White-label отчёты',
    'Export branded reports with your logo.': 'Отчёты с вашим логотипом и брендом.',
    'Instant audits': 'Мгновенные аудиты',
    '60-second audits instead of 3-hour manual work.': 'Аудит за 60 секунд вместо 3 часов работы.',
    'AI Visibility': 'AI-видимость',
    'A feature no other SEO tool provides.': 'Функция, которой нет ни в одном SEO-инструменте.',
    '"1 analyst manages 20 clients instead of 5"': '"1 аналитик ведёт 20 клиентов вместо 5"',
    'Transparent Pricing': 'Прозрачные тарифы',
    'Starter': 'Старт',
    '1 site, all signals, weekly reports': '1 сайт, все сигналы, еженедельный отчёт',
    'Pro': 'Бизнес',
    '3 sites, competitor tracking, AI recs': '3 сайта, сравнение с конкурентами, ИИ-рекомендации',
    'Agency': 'Агентство',
    '20 sites, white-label, API access': '20 сайтов, white-label, доступ к API',
    'Start Free Trial': 'Начать бесплатно',
    "If your score doesn't improve in 7 days, we personally audit your domain. Free.": 'Если ваш балл не вырастет за 7 дней, мы лично проведем аудит домена. Бесплатно.',
    'OmniIQ Agency = $399/mo vs. SEO Analyst Salary = $5,000/mo': 'OmniIQ Эксклюзив = 29 900 ₽/мес (монополия) vs SEO-агентство = от 50 000 ₽/мес',
    'Michael R., B2B Founder': 'Михаил Р., основатель B2B',
    '"Score was 31 on day one. Reached 58 in a week just following 3 steps. Subscribed immediately."': '"Балл в первый день был 31. Вырос до 58 за неделю — выполнил 3 шага. Подписался не думая."',
    'Sarah K., Marketer': 'Анна К., маркетолог',
    '"Finally a report I can show to my boss. And AI assistants now actually know we exist."': '"Наконец-то отчёт, который можно показать боссу. И Алиса теперь нас знает!"',
    'David W., Agency Director': 'Дмитрий В., директор агентства',
    '"My team saves 3 hours per new client. AI visibility tracking is an easy sell."': '"Мои аналитики экономят 3 часа на клиенте. AI-видимость продаётся сама собой."',
    'Get Your Score. Free. Right Now.': 'Узнайте свой балл. Бесплатно.',
    '7 days full access. No credit card. Results visible from day one.': '7 дней доступа. Без карты. Результат виден с первого дня.',
    'Scanning your domain… check your email in 60 seconds!': 'Анализируем домен... проверьте email через 60 секунд!',
    '>$49<': '>1 490 ₽<',
    '>$99<': '>3 990 ₽<',
    '>$399<': '>12 900 ₽<',
    '>$999<': '>29 900 ₽<'
}

for en, ru in replacements.items():
    html = html.replace(en, ru)

# Adjust pricing table specifically for Exclusive
html = html.replace(
    '''<div class="tier">
      <div class="tier-name">Агентство</div>
      <div class="tier-price">12 900 ₽<span>/mo</span></div>
      <ul class="tier-features">
        <li>20 сайтов, white-label, доступ к API</li>
      </ul>
      <a href="#" class="btn" style="width:100%;margin-top:auto">Начать бесплатно &rarr;</a>
    </div>''',
    '''<div class="tier">
      <div class="tier-name">Агентство</div>
      <div class="tier-price">12 900 ₽<span>/мес</span></div>
      <ul class="tier-features">
        <li>20 сайтов, white-label, доступ к API</li>
      </ul>
      <a href="#" class="btn" style="width:100%;margin-top:auto">Начать бесплатно &rarr;</a>
    </div>
    <div class="tier tier-popular">
      <div class="tier-name">Эксклюзив</div>
      <div class="tier-price">29 900 ₽<span>/мес</span></div>
      <ul class="tier-features">
        <li>1 бизнес на город/нишу</li>
        <li>Блокировка конкурентов</li>
        <li>Вся мощь ИИ только для вас</li>
      </ul>
      <a href="#" class="btn" style="width:100%;margin-top:auto">Занять нишу &rarr;</a>
    </div>'''
)

html = html.replace('<span>/mo</span>', '<span>/мес</span>')
html = html.replace('start free trial', 'Начать бесплатно')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)
