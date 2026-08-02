from langgraph.checkpoint.memory import MemorySaver


def create_checkpointer() -> MemorySaver:
    """In-memory checkpointer; swap with a persistent LangGraph checkpointer in production."""
    return MemorySaver()
