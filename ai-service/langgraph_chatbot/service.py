from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage

from graph.graph import build_graph


class LangGraphChatbotService:
    """Compatibility facade for existing FastAPI endpoints."""

    def __init__(self, rag_service=None) -> None:
        self.rag_service = rag_service
        self._graph = build_graph()

    def invoke(self, query: str, thread_id: Optional[str] = None) -> Dict[str, Any]:
        config = {
            "configurable": {
                "thread_id": thread_id or "anonymous"
            }
        }

        state = self._graph.invoke(
            {"messages": [HumanMessage(content=query)]},
            config=config,
        )

        last = state["messages"][-1]
        content = getattr(last, "content", "")

        # Extract plain text from Gemini response
        if isinstance(content, list):
            texts = []

            for block in content:
                if isinstance(block, dict):
                    if block.get("type") == "text":
                        texts.append(block.get("text", ""))
                elif isinstance(block, str):
                    texts.append(block)

            answer = "\n".join(texts).strip()

        elif isinstance(content, str):
            answer = content

        else:
            answer = str(content)

        return {
            "answer": answer or "I couldn't find any matching events.",
            "events": state.get("events", []),
            "intent": state.get("intent", "agentic_tool_calling"),
            "route": state.get("route", "langgraph_agent"),
            "retrieval_context": state.get("semantic_context", ""),
        }