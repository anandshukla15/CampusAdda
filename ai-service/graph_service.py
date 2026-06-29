import re
from typing import Any, Dict, List, Optional, Tuple


class EventGraphService:
    def __init__(self, rag_service) -> None:
        self.rag_service = rag_service

    def route_query(self, query: str) -> Dict[str, Any]:
        normalized = (query or "").strip().lower()
        if not normalized:
            return {"intent": "unknown", "route": "response"}

        if any(keyword in normalized for keyword in ["nearby", "near", "around", "location", "venue", "place"]):
            return {"intent": "nearby", "route": "location"}

        if any(keyword in normalized for keyword in ["recommend", "suggest", "best", "good", "interested", "for me"]):
            return {"intent": "recommend", "route": "recommendation"}

        if any(keyword in normalized for keyword in ["search", "find", "show", "events", "hackathon", "contest", "workshop", "festival", "tournament", "ai", "tech", "sports", "cultural"]):
            return {"intent": "search", "route": "event_search"}

        return {"intent": "general", "route": "response"}

    def execute(self, query: str, events: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        plan = self.route_query(query)
        route = plan["route"]

        if route == "location":
            context = self.rag_service.build_context(query, limit=5)
            return {
                "intent": plan["intent"],
                "route": route,
                "context": context,
                "answer": self._compose_location_answer(query, context),
            }

        if route == "recommendation":
            context = self.rag_service.build_context(query, limit=5)
            return {
                "intent": plan["intent"],
                "route": route,
                "context": context,
                "answer": self._compose_recommendation_answer(query, context),
            }

        if route == "event_search":
            context = self.rag_service.build_context(query, limit=5)
            return {
                "intent": plan["intent"],
                "route": route,
                "context": context,
                "answer": self._compose_search_answer(query, context),
            }

        context = self.rag_service.build_context(query, limit=5)
        return {
            "intent": plan["intent"],
            "route": route,
            "context": context,
            "answer": self._compose_response_answer(query, context),
        }

    def _compose_location_answer(self, query: str, context: str) -> str:
        return f"I can help with nearby or venue-based event options. Here is the best context I found for your query: {context}"

    def _compose_recommendation_answer(self, query: str, context: str) -> str:
        return f"Here are some recommendations for your query: {context}"

    def _compose_search_answer(self, query: str, context: str) -> str:
        return f"Here are the matching events for your query: {context}"

    def _compose_response_answer(self, query: str, context: str) -> str:
        return f"I found the following event context for your query: {context}"
