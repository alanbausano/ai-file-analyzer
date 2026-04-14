import os
import duckdb
import pandas as pd
import re

DB_PATH = os.path.join(os.getcwd(), "data", "business_bi.db")

def slugify(text: str) -> str:
    """Basic slugify for table names."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9_]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text.strip('_')

def save_dataframe_to_duckdb(df: pd.DataFrame, filename: str) -> str:
    """Saves a pandas DataFrame to a new/overwritten DuckDB table."""
    conn = duckdb.connect(DB_PATH)
    
    # Strip extension for table name
    base_name = os.path.splitext(filename)[0]
    table_name = slugify(base_name)
    
    try:
        # DuckDB can create tables directly from Pandas DataFrames in the local scope.
        # Ensure 'df' variable exists within this scope during execute.
        conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df")
        return table_name
    except Exception as e:
        raise RuntimeError(f"Failed to persist {filename} to DuckDB: {str(e)}")
    finally:
        conn.close()
