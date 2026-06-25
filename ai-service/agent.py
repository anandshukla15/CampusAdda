import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

def ask_llm(prompt):
    if not api_key:
        return "Gemini is not configured yet. Add GEMINI_API_KEY in ai-service/.env."

    response = model.generate_content(
        prompt
    )

    return response.text or "I could not generate an answer right now."
