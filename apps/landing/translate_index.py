import re

file_path = r'f:\документы\Загрузки2025\antigravity\OmniIQ\apps\landing\ru\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    'Балл видимости': 'Индекс видимости',
    'балл видимости': 'индекс видимости',
    'Один балл.': 'Один индекс.',
    'свой балл': 'свой индекс',
    'Базовый балл': 'Базовый индекс',
    'Балл растёт': 'Индекс растёт',
    'ваш балл': 'ваш индекс',
    'Динамика балла': 'Динамика индекса',
    'влияние на балл': 'влияние на индекс',
    'Балл в первый': 'Индекс в первый',
    'Балл ': 'Индекс ',
    ' балл ': ' индекс ',
    ' балла ': ' индекса ',
    ' баллу ': ' индексу ',
}

for old, new in replacements.items():
    html = html.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(html)
