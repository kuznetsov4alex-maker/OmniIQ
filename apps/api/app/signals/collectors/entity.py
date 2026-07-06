"""
Entity Collector — checks digital entity presence in knowledge bases.

Signals collected:
  - wikidata_entity: company found in Wikidata
  - wikipedia_page: company has a Wikipedia page
  - entity_description: entity has a description in Wikidata
"""

import logging

import httpx

from app.signals.collectors.base import BaseCollector, SignalData

logger = logging.getLogger(__name__)

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
TIMEOUT = 10.0
USER_AGENT = "OmniIQ/0.2 (https://omniiq.tech; signal-collector)"


class EntityCollector(BaseCollector):
    name = "entity"

    async def collect(
        self, company_id, domain: str | None, company_name: str
    ) -> list[SignalData]:
        signals: list[SignalData] = []

        async with httpx.AsyncClient(
            timeout=TIMEOUT,
            headers={"User-Agent": USER_AGENT},
        ) as client:
            # 1. Wikidata check
            wikidata_result = await self._check_wikidata(client, company_name)
            signals.append(SignalData(
                type="entity", channel="wikidata", metric="wikidata_entity",
                value=1.0 if wikidata_result["found"] else 0.0,
                source="wikidata_api",
                raw_data=wikidata_result,
            ))

            if wikidata_result.get("description"):
                signals.append(SignalData(
                    type="entity", channel="wikidata", metric="entity_description",
                    value=1.0, source="wikidata_api",
                    raw_data={"description": wikidata_result["description"]},
                ))

            # 2. Wikipedia check
            wikipedia_result = await self._check_wikipedia(client, company_name)
            signals.append(SignalData(
                type="entity", channel="wikipedia", metric="wikipedia_page",
                value=1.0 if wikipedia_result["found"] else 0.0,
                source="wikipedia_api",
                raw_data=wikipedia_result,
            ))

        return signals

    async def _check_wikidata(
        self, client: httpx.AsyncClient, company_name: str
    ) -> dict:
        query = f"""
        SELECT ?item ?itemLabel ?description WHERE {{
          ?item wdt:P31/wdt:P279* wd:Q4830453 .
          ?item rdfs:label "{company_name}"@en .
          OPTIONAL {{ ?item schema:description ?description FILTER(LANG(?description) = "en") }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" }}
        }} LIMIT 1
        """
        try:
            r = await client.get(
                WIKIDATA_SPARQL,
                params={"query": query, "format": "json"},
            )
            data = r.json()
            bindings = data.get("results", {}).get("bindings", [])
            if bindings:
                b = bindings[0]
                return {
                    "found": True,
                    "entity_id": b.get("item", {}).get("value", ""),
                    "label": b.get("itemLabel", {}).get("value", company_name),
                    "description": b.get("description", {}).get("value"),
                }
            return {"found": False, "company_name": company_name}
        except Exception as e:
            logger.warning(f"Wikidata check failed for {company_name}: {e}")
            return {"found": False, "error": str(e)}

    async def _check_wikipedia(
        self, client: httpx.AsyncClient, company_name: str
    ) -> dict:
        try:
            r = await client.get(
                WIKIPEDIA_API,
                params={
                    "action": "query",
                    "titles": company_name,
                    "format": "json",
                    "redirects": "1",
                },
            )
            data = r.json()
            pages = data.get("query", {}).get("pages", {})
            # Wikipedia returns -1 as page ID when not found
            found = not any(pid == "-1" for pid in pages)
            return {"found": found, "company_name": company_name, "pages": list(pages.keys())}
        except Exception as e:
            logger.warning(f"Wikipedia check failed for {company_name}: {e}")
            return {"found": False, "error": str(e)}
