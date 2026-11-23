"""A small in-memory rate limiter (per client IP).

It is enough for a portfolio project that runs as a single process.
With several servers, use a shared store such as Redis instead.
"""

import time
from collections import defaultdict, deque

from fastapi import Request

from app.config import get_settings
from app.services.errors import AIServiceError

_hits: dict[str, deque] = defaultdict(deque)
_MAX_TRACKED_CLIENTS = 1000


def _prune(now: float, window: int) -> None:
    """Forget clients that were quiet for a whole window (keeps memory small)."""
    quiet = [ip for ip, hits in _hits.items() if not hits or now - hits[-1] > window]
    for ip in quiet:
        del _hits[ip]


async def check_rate_limit(request: Request) -> None:
    """FastAPI dependency: allow only N requests per window from one IP address."""
    settings = get_settings()
    window = settings.rate_limit_window_seconds
    limit = settings.rate_limit_requests

    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()

    if len(_hits) > _MAX_TRACKED_CLIENTS:
        _prune(now, window)

    hits = _hits[ip]
    while hits and now - hits[0] > window:
        hits.popleft()

    if len(hits) >= limit:
        raise AIServiceError(429, "Too many requests. Please wait a moment and try again.")
    hits.append(now)