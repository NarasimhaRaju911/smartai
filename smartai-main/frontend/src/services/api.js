// Talks to the FastAPI backend. API keys never appear here: they stay on the server.
const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// Slightly longer than the backend's own timeout (30 seconds).
const REQUEST_TIMEOUT_MS = 45000;

// The backend accepts at most 50 messages and 60000 characters per request.
// We send only the most recent part of a long chat to stay safely below that.
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 50000;

function totalChars(list) {
  return list.reduce((sum, m) => sum + m.content.length, 0);
}

function trimHistory(messages) {
  let trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  while (trimmed.length > 1 && totalChars(trimmed) > MAX_HISTORY_CHARS) {
    trimmed = trimmed.slice(1);
  }
  // The conversation sent to the AI should start with a user message.
  while (trimmed.length > 1 && trimmed[0].role !== "user") {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

export async function sendChat(provider, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        // Send only what the backend needs: role and content.
        messages: trimHistory(messages).map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }
    throw new Error("Cannot reach the backend. Make sure it is running (uvicorn) and try again.");
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // The response was not JSON; handled below.
  }

  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : null;
    throw new Error(detail || `Request failed with status ${response.status}.`);
  }

  if (!data || typeof data.reply !== "string") {
    throw new Error("The server sent an unexpected response.");
  }
  return data.reply;
}