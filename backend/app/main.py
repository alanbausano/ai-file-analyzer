import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Ensure data directory exists for persistence
os.makedirs(os.path.join(os.getcwd(), "data"), exist_ok=True)

from app.api.routes import upload, chat
from app.cron import cleanup_database_routine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn background TTL task
    task = asyncio.create_task(cleanup_database_routine())
    yield
    # Shutdown: cancel task safely
    task.cancel()

app = FastAPI(title="Multi-CSV Data Analyst App", lifespan=lifespan)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
# Also include the explicitly provided Vercel URL if desired, or just use the env var
if "https://ai-form-assistant-um2z.vercel.app" not in allowed_origins:
    allowed_origins.append("https://ai-form-assistant-um2z.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
