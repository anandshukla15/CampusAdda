from typing import Any, Dict, List

from langchain_core.tools import tool

from config import MAX_TOOL_RESULTS
from services.node_api import search_events


@tool
def find_nearby_events_tool(location: str, query: str = "events") -> List[Dict[str, Any]]:
    """Find events near a city, venue, college, or location."""
    return search_events(f"{query} {location}", location=location)[:MAX_TOOL_RESULTS]
