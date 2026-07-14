from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_service import EventRAGService
from langgraph_chatbot.service import LangGraphChatbotService

app = FastAPI()
rags = EventRAGService()
langgraph_chatbot = LangGraphChatbotService(rags)

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:3000",
        "https://campus-adda-azure.vercel.app/",
        "https://campusadda-8e15.onrender.com "
    ],
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


def _run_chatbot(query: str):
    return langgraph_chatbot.invoke(query)


@app.post("/chat")
async def chat(data: ChatRequest):
    return _run_chatbot(data.query.strip())


@app.post("/langgraph/chat")
async def langgraph_chat(data: ChatRequest):
    return _run_chatbot(data.query.strip())
