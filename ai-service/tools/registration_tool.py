from typing import Any, Dict, List

from langchain_core.tools import tool

from services.node_api import search_events


@tool
def registration_info_tool(event_name: str) -> List[Dict[str, Any]]:
    """Get official registration links, deadlines, fees, and activity registration information."""
    return search_events(event_name)[:5]
