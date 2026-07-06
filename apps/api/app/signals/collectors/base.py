"""
Base Collector — abstract interface for all signal collectors.
Every collector returns a list of SignalData dicts ready to insert.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SignalData:
    type: str
    channel: str
    metric: str
    value: float        # normalised 0.0–1.0
    source: str
    raw_data: dict[str, Any] = field(default_factory=dict)


class BaseCollector(ABC):
    name: str = "base"

    @abstractmethod
    async def collect(self, company_id, domain: str | None, company_name: str) -> list[SignalData]:
        """
        Run the collector and return raw signal data.
        Must never raise — catch all exceptions internally and return empty list.
        """
        ...
