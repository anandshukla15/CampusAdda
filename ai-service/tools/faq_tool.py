from langchain_core.tools import tool


@tool
def general_faq_tool(question: str) -> str:
    """Answer Campus Adda product questions, not general-world or celebrity questions."""
    return ("Campus Adda helps students discover campus events, activities, venues, and official "
            "registration links. For a specific event, ask me to search by name, category, or location.")
