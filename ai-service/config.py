import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the ai-service folder
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MAX_TOOL_RESULTS = int(os.getenv("MAX_TOOL_RESULTS", "8"))