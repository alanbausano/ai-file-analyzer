import os
import json
from typing import Literal

from langchain_core.messages import SystemMessage, ToolMessage, trim_messages
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq

from app.agent.state import AgentState
from app.agent.tools.python_repl import python_repl_tool

# Initialize the Groq LLM (Ensure GROQ_API_KEY is in environment or passed via config)
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

# Bind the tools to our LLM
tools = [python_repl_tool]
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a Senior Data Analyst. Use the provided schemas to write Python code that queries DuckDB and analyzes data. Always print your final result.
You have access to a Python REPL tool. The REPL starts with `pandas as pd` and `duckdb` already imported globally. 
You can directly access the DuckDB connection via `duckdb.connect('data/business_bi.db')`.
If an error occurs, rewrite the code and try again. Formulate your final response based on the stdout of your scripts.

CRITICAL GUARDRAIL: You are strictly limited to answering questions related to the uploaded Data Schemas and data analysis. If the user asks general knowledge questions, requests recipes, or asks anything completely unrelated to the provided datasets, you MUST politely refuse to answer. State explicitly that your sole purpose is analyzing the uploaded files. Do NOT attempt to answer off-topic prompts.

ZERO-STATE GUARDRAIL: If the `Data Schemas` array below is completely EMPTY ([]), you MUST NOT write any Python code. Instead, politely inform the user: "Please upload a CSV or Excel file using the dashboard on the left before asking questions." Do not attempt any analysis.

Data Schemas for Context:
{schemas}
"""

from langchain_core.messages import SystemMessage, ToolMessage, trim_messages

# ...
def call_model(state: AgentState):
    """Invokes the language model."""
    raw_messages = state.get("messages", [])
    schemas = state.get("data_schemas", [])
    
    formatted_prompt = SYSTEM_PROMPT.format(schemas=json.dumps(schemas, indent=2))
    
    # Strip any existing system messages out to ensure pure trimming logic
    human_and_ai_msgs = [m for m in raw_messages if not isinstance(m, SystemMessage)]
    
    trimmed = trim_messages(
        human_and_ai_msgs,
        max_tokens=10, 
        strategy="last",
        token_counter=len,
        allow_partial=False
    )
    
    # Inject active updated prompt
    final_msgs = [SystemMessage(content=formatted_prompt)] + trimmed
        
    try:
        response = llm_with_tools.invoke(final_msgs)
        return {"messages": [response]}
    except Exception as e:
        from langchain_core.messages import AIMessage
        # Fallback if Groq LLM natively crashes during tool-use JSON formatting
        fallback_msg = AIMessage(content=f"Oops! My logic engine encountered a formatting crash while trying to write the python code. Please rephrase your question and try again! (Internal: {str(e)[:50]}...)")
        return {"messages": [fallback_msg]}


def execute_tools(state: AgentState):
    """Executes the tool calls made by the language model."""
    messages = state.get("messages", [])
    last_message = messages[-1]
    
    tool_responses = []
    error_found = None
    
    for tool_call in getattr(last_message, "tool_calls", []):
        if tool_call["name"] == "python_repl_tool":
            code_args = tool_call["args"]
            action_code = code_args.get("code", "")
            
            output = python_repl_tool.invoke(action_code)
            
            if "Python Error:" in str(output):
                error_found = str(output)
            
            tool_responses.append(ToolMessage(
                content=str(output),
                name=tool_call["name"],
                tool_call_id=tool_call["id"]
            ))
            
    retry_count = state.get("retry_count", 0)
    if error_found:
        retry_count += 1
        
    return {
        "messages": tool_responses, 
        "execution_error": error_found,
        "retry_count": retry_count
    }


def should_continue(state: AgentState) -> Literal["tools", END]:
    """Determines whether to route to the tools or end the flow."""
    messages = state.get("messages", [])
    last_message = messages[-1]
    
    # If the LLM didn't return tool calls, finish
    if not getattr(last_message, "tool_calls", None):
        return END
        
    # Check retry count threshold
    if state.get("retry_count", 0) >= 3:
        return END
        
    return "tools"

# Construct the Graph
workflow = StateGraph(AgentState)

# Define nodes
workflow.add_node("agent", call_model)
workflow.add_node("tools", execute_tools)

# Define edges
workflow.add_edge(START, "agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# Return to agent after tools finish
workflow.add_edge("tools", "agent")

# Use a persistent connection instead of the context manager `from_conn_string` 
# which causes a type error when passed to the checkpointer natively.
conn = sqlite3.connect("data/checkpoints.db", check_same_thread=False)
memory = SqliteSaver(conn)

# Compile graph
app = workflow.compile(checkpointer=memory)
