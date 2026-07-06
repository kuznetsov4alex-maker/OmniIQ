"""
AI Visibility Collector — placeholder for Sprint 3.

AI visibility (ChatGPT, Perplexity, Google AI Overviews) cannot be automatically
queried via public APIs in the current LLM ecosystem.

v1 strategy: manual input via POST /signals/ai endpoint.
v2 strategy: use Perplexity API + LLM self-query simulation.

This collector returns zero signals and logs a guidance message.
"""

import logging

from app.signals.collectors.base import BaseCollector, SignalData

logger = logging.getLogger(__name__)


class AICollector(BaseCollector):
    name = "ai"

    async def collect(
        self, company_id, domain: str | None, company_name: str
    ) -> list[SignalData]:
        logger.info(
            f"AI signals for '{company_name}' require manual input. "
            "Use POST /signals/ai to submit AI visibility observations."
        )
        return []
