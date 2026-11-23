"""Custom error type for problems with an AI provider."""


class AIServiceError(Exception):
    """Raised when an AI provider call fails.

    status_code: HTTP status we send back to the frontend.
    message: a safe, readable message that is OK to show to the user.
    """

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message