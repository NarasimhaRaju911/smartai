// Saves chats in the browser (localStorage) so they survive a page refresh.
// Only chat text is stored here. API keys never reach the browser.
const KEY = "smartai-state-v1";
const MAX_CHATS = 50;

function isValidMessage(m) {
  return (
    m &&
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string"
  );
}

function isValidChat(c) {
  return (
    c &&
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    Array.isArray(c.messages) &&
    c.messages.every(isValidMessage)
  );
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.chats) || data.chats.length === 0 || !data.chats.every(isValidChat)) {
      return null;
    }
    const provider = data.provider === "openai" || data.provider === "gemini" ? data.provider : "gemini";
    const activeChatId = data.chats.some((c) => c.id === data.activeChatId)
      ? data.activeChatId
      : data.chats[0].id;
    return { chats: data.chats, activeChatId, provider };
  } catch {
    return null;
  }
}

export function saveState({ chats, activeChatId, provider }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ chats: chats.slice(0, MAX_CHATS), activeChatId, provider })
    );
  } catch {
    // Storage is full or blocked: the app still works, it just cannot save.
  }
}