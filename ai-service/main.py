from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import ask_llm
from prompts.system_prompt import SYSTEM_PROMPT
from tools.event_tools import find_events

app = FastAPI()

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

@app.post("/chat")
async def chat(data: ChatRequest):

    query = data.query.strip()
    events = find_events(query)

    prompt = f"""
    {SYSTEM_PROMPT}

    User Query:
    {query}

    Matching Events:
    {events}

    Answer user naturally.
    """

    answer = ask_llm(prompt)

    return {
        "answer": answer,
        "events": events
    }
