from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import List
import os
import shutil
import pandas as pd

from app.models.file_metadata import FileMetadataResponse
from app.services.db_service import save_dataframe_to_duckdb
from app.services.profiling_service import profile_dataframe

router = APIRouter()
UPLOAD_DIR = os.path.join(os.getcwd(), "data", "uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.post("/", response_model=List[FileMetadataResponse])
async def upload_files(files: List[UploadFile] = File(...)):
    """Handles multiple file uploads, enforces limits, persists to DuckDB, and profiles."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    responses = []
    
    for file in files:
        # Validate extension
        if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid CSV or Excel file.")
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        # Save file chunks to enforce size limit and persist to disk
        size_accum = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                size_accum += len(chunk)
                if size_accum > MAX_FILE_SIZE:
                    os.remove(file_path)
                    raise HTTPException(status_code=413, detail=f"File {file.filename} exceeds the 50MB limit.")
                buffer.write(chunk)
                
        # Integrity Check & DataFrame Loading
        try:
            if file.filename.endswith('.csv'):
                # Dynamically infer the separator (handles ',', ';', '\t') natively
                df = pd.read_csv(file_path, sep=None, engine='python')
            else:
                df = pd.read_excel(file_path)
        except Exception as e:
            # Corrupted file handling
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"Failed to read {file.filename}. It may be corrupted. Error: {str(e)}")
            
        # 2. DuckDB Integration & Persistence
        try:
            save_dataframe_to_duckdb(df, file.filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error for {file.filename}: {str(e)}")

        # 3. Semantic Schema Discovery (Profiling)
        profile_data = profile_dataframe(df)
        
        # 4. Construct Response using Pydantic models mapping
        metadata_response = FileMetadataResponse(
            filename=file.filename,
            row_count=profile_data["row_count"],
            memory_mb=profile_data["memory_mb"],
            columns=profile_data["columns"],
            sample_rows=profile_data["sample_rows"],
            profile=profile_data["profile"],
            chart_config=profile_data.get("chart_config")
        )
        responses.append(metadata_response)
        
    return responses
