"""Resilient client for the Node API, which remains the MySQL boundary."""
import logging
import os
from typing import Any, Dict, List

from fastapi import params
import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)
BASE_URL = os.getenv("NODE_API_URL", "http://localhost:5000/api/ai").rstrip("/")


@retry(retry=retry_if_exception_type(requests.RequestException), stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=4), reraise=True)
def _get(path: str, params: Dict[str, Any]) -> Any:
    url = f"{BASE_URL}{path}"
    

    response = requests.get(url, params=params, timeout=10)

   

    response.raise_for_status()
    return response.json()


def search_events(query: str, **filters: Any) -> List[Dict[str, Any]]:
    """Retrieve authoritative events from Node/MySQL; never from Chroma alone."""
    try:
        payload = _get("/events/search", {"q": query, **{k: v for k, v in filters.items() if v}})
        return payload if isinstance(payload, list) else []
    except requests.RequestException as exc:
        logger.warning("Node event search unavailable: %s", exc)
        return []
