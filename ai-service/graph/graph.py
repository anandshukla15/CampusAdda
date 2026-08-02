import json
import logging
from typing import Literal

from langchain_core.messages import AIMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from agent import create_agent_model, offline_answer, system_message
from graph.state import AgentState
from services.memory import create_checkpointer
from tools import ALL_TOOLS

logger = logging.getLogger(__name__)


def _agent(state: AgentState):
    messages = state.get("messages", [])
    model = create_agent_model()
    if model is None:
        return {"messages": [offline_answer(messages)]}
    try:
        return {"messages": [model.invoke([system_message(), *messages])]}
    except Exception as exc:
        logger.exception("Gemini invocation failed")
        return {"messages": [AIMessage(content="I could not reach the AI service. Please try again shortly.")], "error": str(exc)}


def _route_tools(state: AgentState) -> Literal["tools", "finalize"]:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else "finalize"


def _finalize(state: AgentState):
    """Expose raw MySQL tool results for API compatibility without asking Chroma to be truth."""
    events = []
    context = []
    for message in state.get("messages", []):
        if getattr(message, "type", "") == "tool":
            try:
                value = json.loads(message.content) if isinstance(message.content, str) else message.content
                if isinstance(value, list):
                    events.extend(item for item in value if isinstance(item, dict))
            except (TypeError, ValueError):
                pass
    return {"events": events[:8], "semantic_context": "Tool results are sourced from Node/MySQL."}


def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", _agent)
    workflow.add_node("tools", ToolNode(ALL_TOOLS, handle_tool_errors=True))
    workflow.add_node("finalize", _finalize)
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", _route_tools, {"tools": "tools", "finalize": "finalize"})
    workflow.add_edge("tools", "agent")
    workflow.add_edge("finalize", END)
    return workflow.compile(checkpointer=create_checkpointer())
