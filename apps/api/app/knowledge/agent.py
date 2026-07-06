"""
Knowledge Agent (v1) — Entity extraction via OpenAI structured outputs.

Takes raw text about a company and returns a list of extracted entities.
All facts must come from the input text — never fabricated (AI Bible: Truth First).
"""

import json
import logging
from dataclasses import dataclass
from typing import Any

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.openai_api_key)

ENTITY_EXTRACTION_PROMPT = """
You are the Knowledge Agent for OmniIQ. Your job is to extract factual entities
from the provided business text.

Rules:
- Only extract entities that are EXPLICITLY mentioned in the text
- Never invent or infer entities that are not in the text
- Each entity must have a clear type: brand, product, person, location, or service
- If unsure about an entity, skip it

Return a JSON object with this structure:
{
  "entities": [
    {
      "type": "brand|product|person|location|service",
      "name": "exact name from text",
      "description": "brief description based only on what is in the text"
    }
  ]
}
"""


@dataclass
class ExtractedEntity:
    type: str
    name: str
    description: str | None


async def extract_entities(text: str, company_name: str) -> list[ExtractedEntity]:
    """
    Extract entities from text using GPT-4o.
    Returns list of ExtractedEntity dataclasses.
    """
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-test"):
        logger.warning("OpenAI API key not configured — skipping entity extraction")
        return []

    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": ENTITY_EXTRACTION_PROMPT},
                {
                    "role": "user",
                    "content": f"Company: {company_name}\n\nText:\n{text[:4000]}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=1000,
        )

        raw = response.choices[0].message.content or "{}"
        data: dict[str, Any] = json.loads(raw)
        entities_data = data.get("entities", [])

        return [
            ExtractedEntity(
                type=e.get("type", "brand"),
                name=e.get("name", ""),
                description=e.get("description"),
            )
            for e in entities_data
            if e.get("name")
        ]

    except Exception as e:
        logger.error(f"Entity extraction failed: {e}")
        return []
