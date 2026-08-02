from typing import Any, Dict, List

from langchain_core.tools import tool

from config import MAX_TOOL_RESULTS
from rag_service import EventRAGService
from services.node_api import search_events


def _merge(authoritative: List[Dict[str, Any]], semantic_ids: set[str]) -> List[Dict[str, Any]]:
    return sorted(authoritative, key=lambda item: str(item.get("id")) not in semantic_ids)


@tool
def recommend_events_tool(query: str) -> List[Dict[str, Any]]:
    """Recommend campus events for interests or preferences. Uses MySQL results plus semantic ranking."""
    events = search_events(query)
    matches = EventRAGService().search(query, limit=MAX_TOOL_RESULTS)
    semantic_ids = {str(match.get("metadata", {}).get("event_id")) for match in matches}
    return _merge(events, semantic_ids)[:MAX_TOOL_RESULTS]
