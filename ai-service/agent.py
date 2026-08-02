import logging
from typing import List

from langchain_core.messages import AIMessage, SystemMessage

from config import GEMINI_MODEL, GEMINI_API_KEY
from prompts.system_prompt import SYSTEM_PROMPT
from tools import ALL_TOOLS

logger = logging.getLogger(__name__)


def create_agent_model():
    """Create Gemini with native LangChain tool binding, or return None when unconfigured."""
    if not GEMINI_API_KEY:
        logger.warning("Gemini key missing; using deterministic offline response")
        return None
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("Using model:", GEMINI_MODEL)
    return ChatGoogleGenerativeAI(model=GEMINI_MODEL, google_api_key=GEMINI_API_KEY, temperature=0).bind_tools(ALL_TOOLS)


def offline_answer(messages: List[object]) -> AIMessage:
    return AIMessage(content="I can help with Campus Adda events. Configure Gemini to enable AI tool selection and detailed answers.")


def system_message() -> SystemMessage:
    return SystemMessage(content=SYSTEM_PROMPT)
