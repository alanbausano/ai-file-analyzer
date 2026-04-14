import operator
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    """
    Represents the state of our Multi-CSV Data Analyst Agent.
    """
    messages: Annotated[Sequence[BaseMessage], operator.add]
    file_paths: list[str]
    data_schemas: list[dict]
    execution_error: str | None
    retry_count: int
