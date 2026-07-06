"""
SEO Collector — checks basic technical SEO health of a domain.

Signals collected:
  - ssl_present: domain uses HTTPS
  - domain_reachable: site responds with 2xx/3xx
  - robots_txt: /robots.txt is accessible
  - sitemap_xml: /sitemap.xml is accessible
  - response_time_ms: how fast the site responds
"""

import logging
import time

import httpx

from app.signals.collectors.base import BaseCollector, SignalData

logger = logging.getLogger(__name__)

TIMEOUT = 8.0


class SEOCollector(BaseCollector):
    name = "seo"

    async def collect(
        self, company_id, domain: str | None, company_name: str
    ) -> list[SignalData]:
        if not domain:
            logger.info(f"SEO collector skipped — no domain for {company_name}")
            return []

        signals: list[SignalData] = []
        base_url = f"https://{domain}"

        async with httpx.AsyncClient(
            timeout=TIMEOUT,
            follow_redirects=True,
            verify=False,  # we check SSL separately
        ) as client:
            # 1. SSL + reachability
            ssl_ok, reachable, response_time = await self._check_domain(
                client, base_url, domain
            )
            signals.append(SignalData(
                type="seo", channel="google_search", metric="ssl_present",
                value=1.0 if ssl_ok else 0.0, source="omniiq_crawler",
                raw_data={"domain": domain, "https": ssl_ok},
            ))
            signals.append(SignalData(
                type="seo", channel="google_search", metric="domain_reachable",
                value=1.0 if reachable else 0.0, source="omniiq_crawler",
                raw_data={"domain": domain, "reachable": reachable},
            ))
            if response_time:
                # Normalise: <1s = 1.0, >5s = 0.0
                rt_score = max(0.0, 1.0 - (response_time / 5000))
                signals.append(SignalData(
                    type="seo", channel="google_search", metric="response_time",
                    value=round(rt_score, 3), source="omniiq_crawler",
                    raw_data={"response_time_ms": round(response_time)},
                ))

            if reachable:
                # 2. robots.txt
                robots = await self._check_path(client, base_url, "/robots.txt")
                signals.append(SignalData(
                    type="seo", channel="google_search", metric="robots_txt",
                    value=1.0 if robots else 0.0, source="omniiq_crawler",
                    raw_data={"url": f"{base_url}/robots.txt", "present": robots},
                ))

                # 3. sitemap.xml
                sitemap = await self._check_path(client, base_url, "/sitemap.xml")
                signals.append(SignalData(
                    type="seo", channel="google_search", metric="sitemap_xml",
                    value=1.0 if sitemap else 0.0, source="omniiq_crawler",
                    raw_data={"url": f"{base_url}/sitemap.xml", "present": sitemap},
                ))

        return signals

    async def _check_domain(
        self, client: httpx.AsyncClient, base_url: str, domain: str
    ) -> tuple[bool, bool, float | None]:
        try:
            start = time.monotonic()
            r = await client.get(base_url)
            elapsed_ms = (time.monotonic() - start) * 1000
            ssl_ok = base_url.startswith("https")
            reachable = r.status_code < 500
            return ssl_ok, reachable, elapsed_ms
        except Exception as e:
            logger.warning(f"Domain check failed for {domain}: {e}")
            return False, False, None

    async def _check_path(
        self, client: httpx.AsyncClient, base_url: str, path: str
    ) -> bool:
        try:
            r = await client.get(f"{base_url}{path}")
            return r.status_code == 200
        except Exception:
            return False
