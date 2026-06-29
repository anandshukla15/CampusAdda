from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import ask_llm
from prompts.system_prompt import SYSTEM_PROMPT
from rag_service import EventRAGService
from graph_service import EventGraphService
from tools.event_tools import find_events

app = FastAPI()
rags = EventRAGService()
graph = EventGraphService(rags)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/index-event")
async def index_event(payload: dict):
    event = payload or {}
    activities = event.get("activities") or []
    rags.index_event(event, activities=activities)
    return {"status": "indexed", "event_id": event.get("id") or event.get("name")}

@app.post("/chat")
async def chat(data: ChatRequest):
    query = data.query.strip()
    events = find_events(query)
    if not isinstance(events, list):
        events = []

    if events:
        for event in events:
            try:
                if isinstance(event, dict):
                    rags.index_event(event, activities=event.get("activities", []))
            except Exception:
                continue

    graph_result = graph.execute(query)
    context = graph_result.get("context", "No relevant events found.")

    prompt = f"""
    {SYSTEM_PROMPT}

    User Query:
    {query}

    Intent:
    {graph_result.get('intent', 'general')}

    Route:
    {graph_result.get('route', 'response')}

    Matching Events:
    {events}

    Retrieval Context:
    {context}

    Answer user naturally and keep it concise.
    """

    answer = ask_llm(prompt)

    if not answer or answer.startswith("Gemini is not configured"):
        answer = graph_result.get("answer", "I could not find a matching event right now.")

    return {
        "answer": answer,
        "events": events,
        "intent": graph_result.get("intent"),
        "route": graph_result.get("route"),
        "retrieval_context": context,
    }
