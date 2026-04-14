import sys
import io
import traceback
from contextlib import redirect_stdout
from langchain_core.tools import tool

@tool
def python_repl_tool(code: str) -> str:
    """
    Executes Python code in a local REPL environment and returns the standard output or error.
    
    Use this tool to interrogate pandas DataFrames. Assume the CSV files have been loaded
    or write the code to load them explicitly from the data/uploads directory.
    
    Args:
        code: A string containing the python code to execute. Print statements are captured.
    """
    # A custom exec wrapper that captures stdout and handles exceptions gracefully.
    # WARNING: This uses exec() and runs locally. It is intended for MVP/internal use.
    
    # We create a string IO to capture standard output.
    captured_stdout = io.StringIO()
    
    import pandas as pd
    import duckdb
    import os

    # Setup global namespace. Injecting common imports and DB path implicitly.
    global_namespace = {
        "pd": pd,
        "duckdb": duckdb,
        "os": os
    }
    
    try:
        # Redirect stdout and execute
        with redirect_stdout(captured_stdout):
            exec(code, global_namespace)
        
        output = captured_stdout.getvalue()
        if not output:
            return "Code executed successfully but returned no text to stdout."
        return output

    except Exception:
        # Return the stack trace to the LLM so it can attempt a fix
        error_info = traceback.format_exc()
        return f"Python Error:\n{error_info}"
