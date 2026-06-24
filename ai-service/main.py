from fastapi import FastAPI

from agent import ask_llm
from tools.event_tools import find_events

app = FastAPI()

@app.post("/chat")
async def chat(data: dict):

    query = data["query"]

    events = find_events(query)

    prompt = f"""

    User Query:
    {query}

    Matching Events:
    {events}

    Answer user naturally.
    """

    answer = ask_llm(prompt)

    return {
        "answer": answer
    }