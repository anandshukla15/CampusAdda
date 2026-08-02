from typing import Any, Dict, List

from langchain_core.tools import tool

from config import MAX_TOOL_RESULTS
from services.node_api import search_events


@tool
def search_events_tool(query: str) -> List[Dict[str, Any]]:
    """Search Campus Adda events by natural-language query. Use for event/fest/activity searches."""
    return search_events(query)[:MAX_TOOL_RESULTS]
