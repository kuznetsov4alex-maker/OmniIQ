"""
Decision Engine Generator — GPT-4o generates prioritised recommendations.

Input:  company context + gap analysis + visibility score
Output: structured list of recommendations with impact, confidence, reasoning

AI Bible rules applied:
  - Grounded only in signals and gaps — never invents facts
  - Every recommendation has traceable reasoning (signals_used field)
  - Confidence score is mandatory on every output
  - Fails safe: falls back to rule-based recs if LLM unavailable
"""

import json
import logging
from dataclasses import dataclass

from openai import AsyncOpenAI

from app.config import settings
from app.recommendations.analyzer import Gap

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.openai_api_key)

DECISION_ENGINE_PROMPT = """
You are the Decision Engine of OmniIQ — an Autonomous Visibility Management platform.

Your job: analyse the company's current visibility gaps and generate the most impactful
recommendations to improve their visibility in search and AI.

STRICT RULES (AI Bible):
1. Only recommend actions that directly address the provided gaps
2. Never invent facts about the company not present in the context
3. Every recommendation must have a traceable reason tied to a specific gap
4. Be specific and actionable — vague advice is worthless

Return a JSON object:
{
  "recommendations": [
    {
      "title": "short action-oriented title (max 80 chars)",
      "description": "2-3 sentences explaining what to do and why it matters for visibility",
      "reasoning": "which specific gap this addresses and why this action closes it",
      "action_steps": ["step 1", "step 2", "step 3"],
      "impact_score": 7.5,
      "confidence": 0.85,
      "category": "seo|ai|entity|reputation|social",
      "effort": "low|medium|high"
    }
  ]
}

Scoring guide:
- impact_score (1-10): how much will this improve the OmniIQ Visibility Score
- confidence (0-1): how certain are we this action will work given current evidence
- effort: low = <1 day, medium = 1-5 days, high = >5 days
"""


@dataclass
class RecommendationData:
    title: str
    description: str
    reasoning: str
    action_steps: list[str]
    impact_score: float
    confidence: float
    category: str
    effort: str
    signals_used: list[str]
    priority_score: float = 0.0

    def __post_init__(self) -> None:
        self.priority_score = round(self.impact_score * self.confidence, 2)


def _fallback_recommendations(gaps: list[Gap]) -> list[RecommendationData]:
    """
    Rule-based fallback when OpenAI is unavailable.
    Always returns at least basic recs from gaps.
    """
    recs = []
    for gap in gaps[:5]:
        if gap.metric == "ssl_present":
            recs.append(RecommendationData(
                title="Enable HTTPS on your website",
                description="Your website doesn't use HTTPS. This is a critical SEO signal and trust factor. Install an SSL certificate immediately.",
                reasoning="ssl_present signal is 0 — site is HTTP only. HTTPS is a confirmed Google ranking factor.",
                action_steps=[
                    "Purchase or get a free SSL certificate via Let's Encrypt",
                    "Install SSL on your web server or hosting provider",
                    "Redirect all HTTP traffic to HTTPS",
                    "Update internal links and canonical URLs to HTTPS",
                ],
                impact_score=9.0, confidence=0.95,
                category="seo", effort="medium",
                signals_used=["seo/google_search/ssl_present"],
            ))
        elif gap.metric == "sitemap_xml":
            recs.append(RecommendationData(
                title="Create and submit a sitemap.xml",
                description="No sitemap found. A sitemap tells search engines which pages exist and should be indexed.",
                reasoning="sitemap_xml signal is 0 — search engine crawlers have no page map.",
                action_steps=[
                    "Generate sitemap.xml (use your CMS plugin or sitemaps.org generator)",
                    "Place it at yourdomain.com/sitemap.xml",
                    "Submit to Google Search Console",
                    "Add Sitemap: directive to robots.txt",
                ],
                impact_score=7.0, confidence=0.9,
                category="seo", effort="low",
                signals_used=["seo/google_search/sitemap_xml"],
            ))
        elif gap.metric == "wikidata_entity":
            recs.append(RecommendationData(
                title="Create a Wikidata entry for your company",
                description="Your company is not on Wikidata. AI systems like ChatGPT and Google AI use Wikidata as a primary fact source.",
                reasoning="wikidata_entity signal is 0 — company invisible to AI knowledge systems.",
                action_steps=[
                    "Create a Wikidata account at wikidata.org",
                    "Create a new item for your company (type: business organization)",
                    "Add key properties: name, website, industry, founding date, headquarters",
                    "Link to any existing Wikipedia, LinkedIn, or Crunchbase pages",
                ],
                impact_score=8.5, confidence=0.85,
                category="entity", effort="low",
                signals_used=["entity/wikidata/wikidata_entity"],
            ))
        elif gap.metric == "ai_visibility_unknown":
            recs.append(RecommendationData(
                title="Измерьте базовую видимость в ИИ-ассистентах",
                description="Данных о видимости в ИИ ещё нет. Нужно узнать, знает ли Алиса и GigaChat о вашей компании.",
                reasoning="ИИ-сигналы не собраны — неизвестно присутствие в российских ИИ.",
                action_steps=[
                    "Спроси Алису: 'Что ты знаешь о компании [Название]?' — запиши ответ",
                    "Спроси GigaChat то же самое и сравни ответы",
                    "Внеси результаты через OmniIQ: вкладка 'Сигналы' → 'Добавить ИИ-сигнал'",
                    "Повтори ежемесячно для отслеживания динамики",
                ],
                impact_score=6.0, confidence=0.8,
                category="ai", effort="low",
                signals_used=[],
            ))
        elif gap.metric == "vk_page_exists":
            recs.append(RecommendationData(
                title="Создайте бизнес-страницу ВКонтакте",
                description="Ваша компания не представлена в VK. VK-страницы ранжируются в Яндексе по брендовым запросам и используются Алисой.",
                reasoning="Сигнал vk_page_exists = 0 — компания отсутствует в VK. Яндекс отдаёт предпочтение VK-страницам в локальной выдаче.",
                action_steps=[
                    "Перейдите на vk.com/business и создайте бизнес-страницу",
                    "Заполните все поля: название, описание, сайт, телефон, адрес, расписание работы",
                    "Добавьте обложку и фото-обзор высокого качества",
                    "Попросите 3-5 первых клиентов вступить в сообщество, чтобы появились отзывы",
                ],
                impact_score=7.5, confidence=0.9,
                category="social", effort="low",
                signals_used=["social/vkontakte/vk_page_exists"],
            ))
        elif gap.metric == "vk_profile_complete":
            recs.append(RecommendationData(
                title="Дозаполните профиль VK-страницы",
                description="Профиль вашей VK-страницы заполнен не полностью. Полнота профиля влияет на надёжность в Яндексе и доверие Алисы к вашим данным.",
                reasoning="vk_profile_complete < 1.0 — не заполнены телефон, адрес или ссылка на сайт.",
                action_steps=[
                    "Добавьте телефон в формате +7XXXXXXXXXX в разделе Контакты",
                    "Укажите адрес или город присутствия",
                    "Добавьте ссылку на сайт в разделе Информация",
                ],
                impact_score=5.0, confidence=0.85,
                category="social", effort="low",
                signals_used=["social/vkontakte/vk_profile_complete"],
            ))
        elif gap.metric == "telegram_exists":
            recs.append(RecommendationData(
                title="Создайте Telegram-канал компании",
                description="Telegram-канал отсутствует. Telegram-каналы индексируются Яндексом и помогают Алисе находить официальный контакт бизнеса.",
                reasoning="telegram_exists = 0 — Telegram-присутствия нет. Аудитория русскоязычных пользователей Telegram > 50 млн чел.",
                action_steps=[
                    "Создайте канал через настройки Telegram (Новый канал)",
                    "Задайте имя канала совпадающее с вашим брендом",
                    "Добавьте описание, логотип и ссылку на сайт",
                    "Опубликуйте ссылку t.me/ваш_канал на сайте и в VK",
                ],
                impact_score=5.5, confidence=0.85,
                category="social", effort="low",
                signals_used=["social/telegram/telegram_exists"],
            ))
    return recs


async def generate_recommendations(
    company_name: str,
    company_domain: str | None,
    gaps: list[Gap],
    visibility_score: float,
    max_recs: int = 5,
) -> list[RecommendationData]:
    """Generate recommendations via GPT-4o, fallback to rule-based."""
    if not gaps:
        return []

    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-test"):
        logger.warning("OpenAI not configured — using fallback recommendations")
        return _fallback_recommendations(gaps)[:max_recs]

    # Build context for GPT-4o
    gaps_text = "\n".join([
        f"- [{g.severity.upper()}] {g.category}/{g.metric}: {g.detail} (current: {g.current_value:.0%})"
        for g in gaps
    ])

    user_prompt = f"""
Company: {company_name}
Domain: {company_domain or "not set"}
Current Visibility Score: {visibility_score:.1f}/100

Visibility Gaps detected:
{gaps_text}

Generate {max_recs} prioritised recommendations to close these gaps.
Focus on highest impact + lowest effort first (quick wins).
"""

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": DECISION_ENGINE_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2000,
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        recs_data = data.get("recommendations", [])

        results = []
        for r in recs_data[:max_recs]:
            # Map gaps to signal refs
            gap_metrics = {g.metric: g.signal_refs for g in gaps}
            category = r.get("category", "seo")
            signals_used: list[str] = []
            for g in gaps:
                if g.category == category:
                    signals_used.extend(g.signal_refs)

            results.append(RecommendationData(
                title=r.get("title", "")[:255],
                description=r.get("description", ""),
                reasoning=r.get("reasoning", ""),
                action_steps=r.get("action_steps", [])[:10],
                impact_score=float(r.get("impact_score", 5.0)),
                confidence=float(r.get("confidence", 0.7)),
                category=category,
                effort=r.get("effort", "medium"),
                signals_used=list(set(signals_used))[:20],
            ))

        # Sort by priority_score descending
        results.sort(key=lambda r: r.priority_score, reverse=True)
        return results

    except Exception as e:
        logger.error(f"LLM recommendation generation failed: {e} — using fallback")
        return _fallback_recommendations(gaps)[:max_recs]
