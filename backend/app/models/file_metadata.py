from pydantic import BaseModel, Field
from typing import List, Dict, Any

class ColumnMetadata(BaseModel):
    name: str = Field(description="The name of the column")
    dtype: str = Field(description="The inferred data type of the column")

class AIProfile(BaseModel):
    domain: str = Field(description="The Business Domain of the file (e.g., Transactions, Payroll, Inventory)")
    description: str = Field(description="A 1-sentence description of what the file represents")

class FileMetadataResponse(BaseModel):
    filename: str = Field(description="The sanitized filename")
    row_count: int = Field(description="Total number of rows in the dataset")
    memory_mb: float = Field(description="Approximate memory footprint in MB")
    columns: List[ColumnMetadata] = Field(description="List of columns and their types")
    sample_rows: List[Dict[str, Any]] = Field(description="First 3 rows as a sample")
    profile: AIProfile = Field(description="AI generated semantic schema profile")
    chart_config: Dict[str, Any] | None = Field(default=None, description="AI configured chart mapping")
