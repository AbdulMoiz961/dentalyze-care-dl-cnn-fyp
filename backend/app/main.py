"""
Dentalyze Care Backend — FastAPI Application Entry Point

Run with:
    cd backend
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from app.routers import auth, patients, analysis
from app.services.inference import load_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # --- Startup ---
    logger.info(f"Starting {settings.APP_NAME} Backend...")

    # Initialize database tables
    init_db()
    logger.info("Database initialized.")

    # Load CNN model if configured
    if settings.USE_CNN_MODEL:
        model_path = str(settings.model_path_resolved)
        loaded = load_model(model_path)
        if loaded:
            logger.info(f"CNN model loaded from {model_path}")
        else:
            logger.warning(
                f"CNN model could not be loaded from {model_path}. "
                "Gemini fallback will be used for analysis."
            )
    else:
        logger.info("CNN model disabled (USE_CNN_MODEL=false). Using Gemini fallback.")

    # Ensure upload directory exists
    settings.upload_dir_resolved
    logger.info(f"Upload directory: {settings.upload_dir_resolved}")

    yield

    # --- Shutdown ---
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Backend API for Dentalyze Care — AI-Powered Dental X-Ray Analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(analysis.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    from app.services.inference import is_model_loaded

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "cnn_model_loaded": is_model_loaded(),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }
