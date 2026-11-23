"""SmartAI backend: FastAPI application entry point."""

import logging

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.rate_limit import check_rate_limit
from app.schemas import ChatRequest, ChatResponse
from app.services import gemini_service, openai_service
from app.services.errors import AIServiceError

logger = logging.getLogger("smartai")
logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="SmartAI API",
    description="Backend for the SmartAI chatbot (OpenAI and Google Gemini).",
    version="1.0.0",
)

# CORS: only the configured frontend origin(s) may call this API from a browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.frontend_origin.split(",") if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# One backend API, two providers: the "provider" field picks the function to call.
PROVIDERS = {
    "openai": openai_service.generate_reply,
    "gemini": gemini_service.generate_reply,
}


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError) -> JSONResponse:
    """Known AI provider problems: return a clear, safe message."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Turn Pydantic validation errors into one short, readable message."""
    message = "Invalid request."
    errors = exc.errors()
    if errors:
        message = str(errors[0].get("msg", message)).removeprefix("Value error, ")
    return JSONResponse(status_code=422, content={"detail": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log the real error on the server, but show users a safe, generic message."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on the server. Please try again."},
    )


@app.get("/")
def root() -> dict:
    return {"app": "SmartAI API", "status": "running", "version": app.version}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse, dependencies=[Depends(check_rate_limit)])
async def chat(request: ChatRequest) -> ChatResponse:
    """Send the conversation to the selected AI provider and return its reply."""
    generate_reply = PROVIDERS[request.provider]
    reply = await generate_reply(request.messages)
    return ChatResponse(provider=request.provider, reply=reply)