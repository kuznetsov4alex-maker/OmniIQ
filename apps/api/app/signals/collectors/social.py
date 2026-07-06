"""
Social Collector — checks Russian social network presence for a business.

Signals collected:
  - vk_page_exists:     VK public page / group exists for this brand
  - vk_profile_complete: VK page has website, phone, address filled in
  - telegram_exists:    Telegram channel/bot exists for this brand
  - ok_page_exists:     Odnoklassniki page exists (older demographic reach)

Strategy (no API keys required for basic checks):
  - VK: search vk.com/search?c[section]=communities&q={company}
        and fetch vk.com/{slug} where slug = domain without TLD
  - Telegram: t.me/{slug} — check HTTP 200 vs 404
  - OK: ok.ru/search?query={company}&st.cmd=anonymMain

All checks are read-only, non-authenticated HTTP requests.
Falls back gracefully if network is unavailable.

AI Bible:
  - value=1.0 means "signal confirmed present"
  - value=0.0 means "signal confirmed absent"
  - Raw data always includes the URL checked so recommendations can link to it
"""

import logging
import re
import urllib.parse

import httpx

from app.signals.collectors.base import BaseCollector, SignalData

logger = logging.getLogger(__name__)
TIMEOUT = 10.0
USER_AGENT = (
    "Mozilla/5.0 (compatible; OmniIQ-Crawler/1.0; +https://omniiq.tech/bot)"
)


def _slug_from_domain(domain: str) -> str:
    """Extract a usable slug from domain: klinika-smail.ru → klinika-smail"""
    # Strip www. and TLD
    d = domain.lower().removeprefix("www.")
    parts = d.rsplit(".", 1)
    return parts[0] if parts else d


def _transliterate_simple(name: str) -> str:
    """Very basic Cyrillic → Latin for VK/Telegram slug guessing."""
    table = str.maketrans(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
        "abvgdeyozhzijklmnoprstufhcchshschyeyuyaABVGDEYOZHZIJKLMNOPRSTUFHCCHSHSCHYEYUYA",
    )
    return name.translate(table).lower().replace(" ", "")


class SocialCollector(BaseCollector):
    name = "social"

    async def collect(
        self, company_id, domain: str | None, company_name: str
    ) -> list[SignalData]:
        signals: list[SignalData] = []
        slug = _slug_from_domain(domain) if domain else _transliterate_simple(company_name)

        async with httpx.AsyncClient(
            timeout=TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": USER_AGENT},
            verify=False,
        ) as client:
            # ── 1. VK page exists ─────────────────────────────────────
            vk_url = f"https://vk.com/{slug}"
            vk_exists, vk_raw = await self._check_social_page(
                client, vk_url, positive_pattern=r"og:type"
            )

            # Also try VK search if direct slug fails
            if not vk_exists:
                q = urllib.parse.quote(company_name)
                vk_search = f"https://vk.com/search?c[section]=communities&q={q}"
                vk_search_ok, _ = await self._check_social_page(
                    client, vk_search,
                    positive_pattern=r'"members_count"',
                )
                vk_exists = vk_search_ok

            signals.append(SignalData(
                type="social",
                channel="vkontakte",
                metric="vk_page_exists",
                value=1.0 if vk_exists else 0.0,
                source="omniiq_crawler",
                raw_data={
                    "url_checked": vk_url,
                    "exists": vk_exists,
                    "create_url": f"https://vk.com/business",
                },
            ))

            # ── 2. VK profile completeness (only if page found) ───────
            if vk_exists and vk_raw:
                has_phone = bool(re.search(r'\+7|8-\d{3}|tel:', vk_raw, re.I))
                has_address = bool(re.search(r'"address"|"city"', vk_raw, re.I))
                has_site = bool(re.search(rf'{re.escape(domain or "")}|"site"', vk_raw, re.I)) if domain else False
                completeness_score = round(
                    sum([has_phone, has_address, has_site]) / 3, 2
                )
                signals.append(SignalData(
                    type="social",
                    channel="vkontakte",
                    metric="vk_profile_complete",
                    value=completeness_score,
                    source="omniiq_crawler",
                    raw_data={
                        "has_phone": has_phone,
                        "has_address": has_address,
                        "has_website": has_site,
                        "score": completeness_score,
                    },
                ))
            else:
                # Page doesn't exist — completeness is 0
                signals.append(SignalData(
                    type="social",
                    channel="vkontakte",
                    metric="vk_profile_complete",
                    value=0.0,
                    source="omniiq_crawler",
                    raw_data={"reason": "VK page not found"},
                ))

            # ── 3. Telegram channel exists ────────────────────────────
            tg_url = f"https://t.me/{slug}"
            tg_exists, _ = await self._check_social_page(
                client, tg_url,
                positive_pattern=r'tgme_page_title|og:title',
            )

            # Try brand-name based slug if domain-based fails
            if not tg_exists:
                tg_slug2 = _transliterate_simple(company_name)
                tg_url2 = f"https://t.me/{tg_slug2}"
                tg_exists, _ = await self._check_social_page(
                    client, tg_url2,
                    positive_pattern=r'tgme_page_title|og:title',
                )
                if tg_exists:
                    tg_url = tg_url2

            signals.append(SignalData(
                type="social",
                channel="telegram",
                metric="telegram_exists",
                value=1.0 if tg_exists else 0.0,
                source="omniiq_crawler",
                raw_data={
                    "url_checked": tg_url,
                    "exists": tg_exists,
                    "create_url": "https://telegram.org/",
                },
            ))

            # ── 4. OK.ru presence (Odnoklassniki) ─────────────────────
            q_ok = urllib.parse.quote(company_name)
            ok_url = f"https://ok.ru/search?query={q_ok}&st.cmd=anonymMain"
            ok_exists, ok_raw = await self._check_social_page(
                client, ok_url,
                positive_pattern=r'group-card|__groupCard',
            )
            signals.append(SignalData(
                type="social",
                channel="odnoklassniki",
                metric="ok_page_exists",
                value=1.0 if ok_exists else 0.0,
                source="omniiq_crawler",
                raw_data={
                    "url_checked": ok_url,
                    "exists": ok_exists,
                },
            ))

        return signals

    async def _check_social_page(
        self,
        client: httpx.AsyncClient,
        url: str,
        positive_pattern: str = "",
    ) -> tuple[bool, str]:
        """
        Returns (exists: bool, body_snippet: str).
        exists=True if HTTP 200 and (no pattern required OR pattern found in body).
        """
        try:
            r = await client.get(url)
            if r.status_code != 200:
                return False, ""
            body = r.text[:8000]  # Only scan first 8KB
            if positive_pattern:
                found = bool(re.search(positive_pattern, body, re.I))
                return found, body
            return True, body
        except Exception as e:
            logger.debug(f"Social check failed for {url}: {e}")
            return False, ""
