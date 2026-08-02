from typing import Annotated, Any, Dict, List, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict, total=False):
    messages: Annotated[List[BaseMessage], add_messages]
    events: List[Dict[str, Any]]
    semantic_context: str
    error: str
