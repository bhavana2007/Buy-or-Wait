from fastapi import FastAPI
from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router
from app.models.database import engine, Base

from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Create tables (we will use alembic eventually, keeping for backward compat if missing)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Buy or Wait API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
