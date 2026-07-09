from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from agent import ask_llm
from prompts.system_prompt import SYSTEM_PROMPT
from rag_service import EventRAGService
from tools.event_tools import find_events


class ChatState(TypedDict, total=False):
    query: str
    intent: str
    route: str
    events: List[Dict[str, Any]]
    context: str
    answer: str


class LangGraphChatbotService:
    def __init__(self, rag_service: Optional[EventRAGService] = None) -> None:
        self.rag_service = rag_service or EventRAGService()
        self._graph = self._build_graph()

    def invoke(self, query: str) -> Dict[str, Any]:
        state = self._graph.invoke({"query": query})
        return {
            "answer": state.get("answer", "I could not find a matching event right now."),
            "events": state.get("events") or [],
            "intent": state.get("intent"),
            "route": state.get("route"),
            "retrieval_context": state.get("context", "No relevant events found."),
        }

    def _build_graph(self):
        workflow = StateGraph(ChatState)
        workflow.add_node("classify", self._classify_query)
        workflow.add_node("fetch_events", self._fetch_events)
        workflow.add_node("build_context", self._build_context)
        workflow.add_node("generate_answer", self._generate_answer)

        workflow.add_edge(START, "classify")
        workflow.add_conditional_edges(
            "classify",
            self._choose_next_step,
            {
                "fetch_events": "fetch_events",
                "generate_answer": "generate_answer",
            },
        )
        workflow.add_edge("fetch_events", "build_context")
        workflow.add_edge("build_context", "generate_answer")
        workflow.add_edge("generate_answer", END)
        return workflow.compile()

    def _choose_next_step(self, state: ChatState) -> str:
        query = (state.get("query") or "").strip()
        if not query:
            return "generate_answer"
        return "fetch_events"

    def _classify_query(self, state: ChatState) -> Dict[str, Any]:
        normalized = (state.get("query") or "").strip().lower()
        if not normalized:
            return {"intent": "unknown", "route": "response"}

        if any(keyword in normalized for keyword in ["nearby", "near", "around", "location", "venue", "place"]):
            return {"intent": "nearby", "route": "location"}

        if any(keyword in normalized for keyword in ["recommend", "suggest", "best", "good", "interested", "for me"]):
            return {"intent": "recommend", "route": "recommendation"}

        if any(
            keyword in normalized
            for keyword in ["search", "find", "show", "events", "hackathon", "contest", "workshop", "festival", "tournament", "ai", "tech", "sports", "cultural"]
        ):
            return {"intent": "search", "route": "event_search"}

        return {"intent": "general", "route": "response"}

    def _fetch_events(self, state: ChatState) -> Dict[str, Any]:
        query = (state.get("query") or "").strip()
        events = find_events(query)
        if not isinstance(events, list):
            events = []

        for event in events:
            try:
                if isinstance(event, dict):
                    self.rag_service.index_event(event, activities=event.get("activities", []))
            except Exception:
                continue

        return {"events": events}

    def _build_context(self, state: ChatState) -> Dict[str, Any]:
        query = (state.get("query") or "").strip()
        context = self.rag_service.build_context(query, limit=5)
        return {"context": context}

    def _generate_answer(self, state: ChatState) -> Dict[str, Any]:
        query = (state.get("query") or "").strip()
        events = state.get("events") or []
        context = state.get("context", "No relevant events found.")

        prompt = f"""
{SYSTEM_PROMPT}

User Query:
{query}

Intent:
{state.get('intent', 'general')}

Route:
{state.get('route', 'response')}

Matching Events:
{events}

Retrieval Context:
{context}

Answer user naturally and keep it concise.
"""

        answer = ask_llm(prompt)
        if not answer or answer.startswith("Gemini is not configured"):
            if context and context != "No relevant events found.":
                answer = f"I found these matching events: {context}"
            else:
                answer = "I could not find a matching event right now."

        return {"answer": answer}
