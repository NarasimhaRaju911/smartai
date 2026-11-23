"""Request and response models. Pydantic validates incoming data automatically."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_MESSAGES = 50
MAX_USER_CHARS = 8000  # one message typed by the user
MAX_ASSISTANT_CHARS = 32000  # one earlier AI answer (AI answers can be long)
MAX_TOTAL_CHARS = 60000  # the whole conversation


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message content cannot be empty.")
        return value

    @model_validator(mode="after")
    def content_must_not_be_too_long(self) -> "Message":
        limit = MAX_USER_CHARS if self.role == "user" else MAX_ASSISTANT_CHARS
        if len(self.content) > limit:
            raise ValueError(f"Message is too long (maximum {limit} characters).")
        return self


class ChatRequest(BaseModel):
    provider: Literal["openai", "gemini"]
    messages: list[Message] = Field(..., min_length=1, max_length=MAX_MESSAGES)

    @model_validator(mode="after")
    def check_conversation(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user.")
        if sum(len(m.content) for m in self.messages) > MAX_TOTAL_CHARS:
            raise ValueError("The conversation is too long. Please start a new chat.")
        return self


class ChatResponse(BaseModel):
    provider: str
    reply: str