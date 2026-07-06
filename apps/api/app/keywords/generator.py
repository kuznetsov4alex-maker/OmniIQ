"""
Keyword Generator — GPT-4o generates semantic keyword core and SEO articles.

Two functions:
  generate_keywords(company_name, domain, description) -> list of keyword dicts
  generate_article(company_name, domain, query, cluster) -> article dict

Fallback mode works without OpenAI key (returns template-based keywords).
"""

import json
import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.openai_api_key)

KEYWORD_SYSTEM_PROMPT = """Ты — эксперт по SEO для русскоязычного рынка. Твоя задача — составить семантическое ядро для бизнеса.

Создай ровно {max_keywords} поисковых запросов для бизнеса.
Сгруппируй их по кластерам:
- "брендовые" — запросы с названием компании (5-7 шт)
- "коммерческие" — запросы с намерением купить/заказать (15-20 шт)
- "информационные" — вопросы по теме бизнеса (10-15 шт)
- "локальные" — запросы с городом/районом (8-10 шт)
- "конкурентные" — запросы по нише без бренда (8-10 шт)

Верни JSON:
{
  "keywords": [
    {
      "query": "текст запроса на русском",
      "cluster": "коммерческие",
      "intent": "commercial",
      "difficulty": "medium"
    }
  ]
}

Правила:
- Все запросы исключительно на русском языке
- Реалистичные запросы которые люди реально вводят в Яндексе
- intent: commercial | informational | navigational | local
- difficulty: low | medium | high
- Учитывай специфику российского рынка (Яндекс важнее Google)
"""

ARTICLE_SYSTEM_PROMPT = """Ты — опытный SEO-копирайтер для российского рынка.

Напиши SEO-оптимизированную статью для сайта.

Бизнес: {company_name}
Сайт: {domain}
Целевой запрос: {query}
Кластер: {cluster}

Требования:
- Длина: 800-1200 слов
- Формат: Markdown (заголовки h2, h3, списки)
- Начни с h1 заголовка содержащего ключевой запрос
- Естественно вставь запрос 3-5 раз по тексту
- Структура: вступление → основная часть (3-4 раздела) → заключение с CTA
- Tone: профессиональный, доверительный, для русской аудитории
- В конце призыв к действию связанный с бизнесом

Верни JSON:
{
  "title": "h1 заголовок",
  "content": "полный текст статьи в Markdown",
  "meta_description": "мета-описание 150-160 символов"
}
"""


async def generate_keywords(
    company_name: str,
    domain: str | None,
    description: str | None,
    max_keywords: int = 50,
) -> list[dict]:
    """Generate semantic keyword core for a company via GPT-4o."""
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-test"):
        logger.warning("OpenAI not configured — using fallback keywords")
        return _fallback_keywords(company_name, max_keywords)

    user_prompt = f"""Компания: {company_name}
Домен: {domain or 'не указан'}
Описание: {description or 'не указано'}

Создай {max_keywords} поисковых запросов для этого бизнеса."""

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": KEYWORD_SYSTEM_PROMPT.format(max_keywords=max_keywords)},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=4000,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        keywords = data.get("keywords", [])
        return keywords[:max_keywords]
    except Exception as e:
        logger.error(f"Keyword generation failed: {e} — using fallback")
        return _fallback_keywords(company_name, max_keywords)


async def generate_article(
    company_name: str,
    domain: str | None,
    query: str,
    cluster: str | None,
) -> dict:
    """Generate SEO article for a single keyword via GPT-4o."""
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-test"):
        return {
            "title": f"{query} — {company_name}",
            "content": f"# {query}\n\nСтатья будет сгенерирована после настройки OpenAI API.\n\n## О компании {company_name}\n\nПодробную информацию о наших услугах вы найдёте на сайте.",
            "meta_description": f"{query}. Подробнее на сайте {company_name}.",
        }

    try:
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{
                "role": "user",
                "content": ARTICLE_SYSTEM_PROMPT.format(
                    company_name=company_name,
                    domain=domain or "не указан",
                    query=query,
                    cluster=cluster or "общие",
                ),
            }],
            response_format={"type": "json_object"},
            temperature=0.6,
            max_tokens=4000,
        )
        return json.loads(resp.choices[0].message.content or "{}")
    except Exception as e:
        logger.error(f"Article generation failed for '{query}': {e}")
        return {
            "title": query,
            "content": f"# {query}\n\nОшибка генерации статьи.",
            "meta_description": "",
        }


def _fallback_keywords(company_name: str, n: int) -> list[dict]:
    """Rule-based fallback keywords when OpenAI is unavailable."""
    templates = [
        (company_name, "брендовые", "navigational", "low"),
        (f"{company_name} отзывы", "брендовые", "informational", "low"),
        (f"{company_name} цены", "коммерческие", "commercial", "low"),
        (f"{company_name} контакты", "брендовые", "navigational", "low"),
        (f"услуги {company_name}", "коммерческие", "commercial", "medium"),
        (f"заказать в {company_name}", "коммерческие", "commercial", "medium"),
        (f"{company_name} официальный сайт", "брендовые", "navigational", "low"),
        (f"как работает {company_name}", "информационные", "informational", "medium"),
        (f"{company_name} акции", "коммерческие", "commercial", "medium"),
        (f"{company_name} скидки", "коммерческие", "commercial", "medium"),
    ]
    result = []
    for i, (q, cluster, intent, diff) in enumerate(templates[:n]):
        result.append({"query": q, "cluster": cluster, "intent": intent, "difficulty": diff})
    return result
