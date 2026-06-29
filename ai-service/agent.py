import os
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = None
if genai is not None and api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")


def ask_llm(prompt):
    if not api_key or model is None:
        return (
            "Gemini is not configured yet. Add GEMINI_API_KEY in ai-service/.env. "
            "I can still return a retrieval-based answer from the indexed event data."
        )

    response = model.generate_content(prompt)
    return response.text or "I could not generate an answer right now."
