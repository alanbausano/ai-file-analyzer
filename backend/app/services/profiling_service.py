import pandas as pd
import json
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import os

# Initialize the LLM (Requires GROQ_API_KEY env var)
llm = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0)

def profile_dataframe(df: pd.DataFrame) -> dict:
    """Profiles a dataframe using pandas and Groq AI, and generates auto-visualizations."""
    
    # 1. Gather Pandas Stats
    row_count = len(df)
    memory_mb = df.memory_usage(deep=True).sum() / (1024 * 1024)
    memory_mb = round(memory_mb, 4)
    
    columns = [{"name": c, "dtype": str(df[c].dtype)} for c in df.columns]
    
    # Take up to top 3 rows, converting to dictionaries properly
    sample_df = df.head(3).fillna("").astype(str)
    sample_rows = sample_df.to_dict(orient="records")
    
    # 2. Extract context for AI
    header_list = list(df.columns)
    
    # Call Groq to generate the semantic profile and chart structures
    system_prompt = """You are an expert Data Engineer AI.
Analyze the provided table headers and sample data. 
You must output a raw JSON object with NO markdown formatting, NO code blocks, and NO other text.
The JSON must strictly follow this exact schema:
{
  "domain": "String (e.g., Transactions, Payroll, Inventory, unknown)",
  "description": "String (1 sentence description of what the dataset represents)",
  "suggested_chart": {
      "title": "String (e.g., Top 10 Segments by Revenue)",
      "type": "String (must be exactly 'bar' or 'line')",
      "xAxisKey": "String (must be an exact categorical column name from the headers provided)",
      "seriesKey": "String (must be an exact numeric column name from the headers provided to aggregate)"
  }
}
"""
    
    human_prompt = f"""
Headers: {header_list}
Sample Data: {sample_rows}
"""
    
    ai_profile = {"domain": "Unknown", "description": "Failed to generate description."}
    chart_config = None
    
    try:
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_prompt)
        ])
        content_str = response.content.strip()
        
        # Cleanup in case LLM decides to wrap in markdown anyway
        if content_str.startswith("```json"):
            content_str = content_str[7:-3].strip()
        elif content_str.startswith("```"):
            content_str = content_str[3:-3].strip()
            
        parsed_json = json.loads(content_str)
        if "domain" in parsed_json and "description" in parsed_json:
            ai_profile = {
                "domain": parsed_json["domain"],
                "description": parsed_json["description"]
            }
            
        # Chart Processing
        if "suggested_chart" in parsed_json:
            s_chart = parsed_json["suggested_chart"]
            x_col = s_chart.get("xAxisKey")
            y_col = s_chart.get("seriesKey")
            
            if x_col in df.columns and y_col in df.columns:
                # Typecheck fallback: ensure it can actually aggregate
                try:
                    df[y_col] = pd.to_numeric(df[y_col], errors='coerce')
                    agg_df = df.groupby(x_col)[y_col].sum().sort_values(ascending=False).head(10).reset_index()
                    # Drop NANs introduced by coerce
                    agg_df = agg_df.dropna()
                    
                    if not agg_df.empty:
                        data_points = agg_df.to_dict(orient="records")
                        chart_config = {
                            "id": "chart_" + os.urandom(4).hex(),
                            "title": s_chart.get("title", f"{y_col} by {x_col}"),
                            "description": "Automatically generated from semantic profile.",
                            "type": s_chart.get("type", "bar"),
                            "xAxisKey": x_col,
                            "seriesKeys": [y_col],
                            "data": data_points
                        }
                except Exception as e:
                    print(f"Chart Render Aggregation Error: {e}")
                    
    except Exception as e:
        print(f"AI Profiling Error: {e}")
        
    return {
        "row_count": row_count,
        "memory_mb": memory_mb,
        "columns": columns,
        "sample_rows": sample_rows,
        "profile": ai_profile,
        "chart_config": chart_config
    }
