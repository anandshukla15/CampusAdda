import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langgraph_chatbot.service import LangGraphChatbotService
from rag_service import EventRAGService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
app = FastAPI(title="Campus Adda Agent Service")
rags = EventRAGService()
chatbot = LangGraphChatbotService(rags)
app.add_middleware(CORSMiddleware, 
                   allow_origins=[
        "http://localhost:3000",
        "https://campus-adda-azure.vercel.app/",
        "https://campusadda-8e15.onrender.com "
    ], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    thread_id: Optional[str] = Field(default=None, max_length=128)


class ChatResponse(BaseModel):
    """Stable, structured response contract consumed by the existing Node route."""
    answer: str
    events: list[dict]
    intent: str
    route: str
    retrieval_context: str


@app.get("/health")
async def health(): return {"status": "ok"}


@app.post("/index-event")
async def index_event(payload: dict):
    """Accept both the new envelope and the legacy raw event payload."""
    action = payload.get("action", "upsert")
    event = payload.get("event") if isinstance(payload.get("event"), dict) else payload
    event_id = payload.get("event_id") or event.get("id")
    if action == "delete":
        if event_id is None: raise HTTPException(400, "event_id is required for deletion")
        rags.delete_event(str(event_id)); return {"status": "deleted", "event_id": event_id}
    if not event.get("name"): raise HTTPException(400, "event.name is required")
    result = rags.index_event(event, activities=event.get("activities", []))
    return {"status": "indexed", "event_id": result["event_id"]}


@app.post("/chat")
@app.post("/langgraph/chat")
async def chat(data: ChatRequest) -> ChatResponse:
    return chatbot.invoke(data.query.strip(), data.thread_id)
