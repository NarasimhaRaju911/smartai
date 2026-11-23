"""Google Gemini integration using the official Google Gen AI SDK."""

import asyncio
import logging
from functools import lru_cache

from google import genai
from google.genai import errors, types

from app.config import get_settings
from app.schemas import Message
from app.services.errors import AIServiceError

logger = logging.getLogger("smartai.gemini")

SYSTEM_INSTRUCTIONS = (
    "You are SmartAI, a helpful, friendly and accurate AI assistant. "
    "Answer clearly. Use Markdown for formatting and fenced code blocks for code."
)

PLACEHOLDER_KEY = "your_gemini_api_key_here"


@lru_cache
def _get_client(api_key: str) -> genai.Client:
    """Create the Gemini client once and reuse it."""
    return genai.Client(api_key=api_key)


def _map_api_error(exc: errors.APIError) -> AIServiceError:
    """Convert a Gemini SDK error into a safe, readable error for the user."""
    code = getattr(exc, "code", None)
    text = str(getattr(exc, "message", "") or exc).lower()
    logger.error("Gemini API error (code=%s): %s", code, text[:300])

    if code in (400, 401, 403) and "api key" in text:
        return AIServiceError(502, "Gemini rejected the API key. Please check backend/.env.")
    if code in (401, 403):
        return AIServiceError(502, "Your Gemini key does not have permission for this request.")
    if code == 404:
        return AIServiceError(
            502, "The configured Gemini model was not found. Check GEMINI_MODEL in backend/.env."
        )
    if code == 429:
        return AIServiceError(
            429, "Gemini rate limit or quota exceeded. Please wait a moment and try again."
        )
    if code == 400:
        return AIServiceError(400, "Gemini could not process this request.")
    if isinstance(code, int) and code >= 500:
        return AIServiceError(503, "Gemini is busy or unavailable right now. Please try again.")
    return AIServiceError(502, "Gemini returned an unexpected error. Please try again.")


async def generate_reply(messages: list[Message]) -> str:
    """Send the conversation to Gemini and return the text reply."""
    settings = get_settings()

    if not settings.gemini_api_key or settings.gemini_api_key == PLACEHOLDER_KEY:
        raise AIServiceError(
            503, "Gemini API key is not configured on the server. Add it to backend/.env."
        )

    client = _get_client(settings.gemini_api_key)

    # Gemini calls the AI side of the chat "model" instead of "assistant".
    contents = [
        types.Content(
            role="user" if m.role == "user" else "model",
            parts=[types.Part.from_text(text=m.content)],
        )
        for m in messages
    ]
    config = types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTIONS)

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            ),
            timeout=settings.request_timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.error("Gemini request timed out.")
        raise AIServiceError(504, "Gemini took too long to respond. Please try again.")
    except errors.APIError as exc:
        raise _map_api_error(exc)
    except Exception:
        logger.exception("Unexpected Gemini error.")
        raise AIServiceError(
            502, "Could not get a response from Gemini. Check your internet connection."
        )

    reply = (response.text or "").strip()
    if not reply:
        raise AIServiceError(
            502, "Gemini returned an empty response (it may have been blocked). Try rephrasing."
        )
    return reply