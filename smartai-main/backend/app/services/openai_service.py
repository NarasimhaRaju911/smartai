"""OpenAI integration using the official SDK and the Responses API."""

import logging
from functools import lru_cache

import openai
from openai import AsyncOpenAI

from app.config import get_settings
from app.schemas import Message
from app.services.errors import AIServiceError

logger = logging.getLogger("smartai.openai")

SYSTEM_INSTRUCTIONS = (
    "You are SmartAI, a helpful, friendly and accurate AI assistant. "
    "Answer clearly. Use Markdown for formatting and fenced code blocks for code."
)

PLACEHOLDER_KEY = "your_openai_api_key_here"


@lru_cache
def _get_client(api_key: str, timeout_seconds: int) -> AsyncOpenAI:
    """Create the OpenAI client once and reuse it."""
    return AsyncOpenAI(api_key=api_key, timeout=timeout_seconds, max_retries=1)


async def generate_reply(messages: list[Message]) -> str:
    """Send the conversation to OpenAI and return the text reply."""
    settings = get_settings()

    if not settings.openai_api_key or settings.openai_api_key == PLACEHOLDER_KEY:
        raise AIServiceError(
            503, "OpenAI API key is not configured on the server. Add it to backend/.env."
        )

    client = _get_client(settings.openai_api_key, settings.request_timeout_seconds)

    # The Responses API is stateless: we send the full conversation every time.
    conversation = [{"role": m.role, "content": m.content} for m in messages]

    try:
        response = await client.responses.create(
            model=settings.openai_model,
            instructions=SYSTEM_INSTRUCTIONS,
            input=conversation,
        )
    except openai.AuthenticationError:
        logger.error("OpenAI rejected the API key.")
        raise AIServiceError(502, "OpenAI rejected the API key. Please check backend/.env.")
    except openai.RateLimitError:
        logger.error("OpenAI rate limit or quota exceeded.")
        raise AIServiceError(
            429, "OpenAI rate limit or quota exceeded. Check your OpenAI billing and credits."
        )
    except openai.NotFoundError:
        logger.error("OpenAI model not found: %s", settings.openai_model)
        raise AIServiceError(
            502, "The configured OpenAI model was not found. Check OPENAI_MODEL in backend/.env."
        )
    except openai.PermissionDeniedError:
        logger.error("OpenAI permission denied for model %s", settings.openai_model)
        raise AIServiceError(
            502, "Your OpenAI account does not have access to this model or request."
        )
    except openai.BadRequestError:
        logger.exception("OpenAI rejected the request.")
        raise AIServiceError(400, "OpenAI could not process this request.")
    except openai.APITimeoutError:
        logger.error("OpenAI request timed out.")
        raise AIServiceError(504, "OpenAI took too long to respond. Please try again.")
    except openai.APIConnectionError:
        logger.error("Could not connect to OpenAI.")
        raise AIServiceError(503, "Could not connect to OpenAI. Check your internet connection.")
    except openai.OpenAIError:
        logger.exception("Unexpected OpenAI error.")
        raise AIServiceError(502, "OpenAI returned an unexpected error. Please try again.")

    reply = (response.output_text or "").strip()
    if not reply:
        raise AIServiceError(502, "OpenAI returned an empty response. Please try again.")
    return reply