import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { sendChat } from "./services/api";
import { loadState, saveState } from "./utils/storage";
import useTheme from "./hooks/useTheme";

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createChat() {
  return { id: makeId(), title: "New chat", messages: [] };
}

function makeTitle(text) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 32 ? `${oneLine.slice(0, 32).trim()}...` : oneLine;
}

export default function App() {
  // Load saved chats once when the app starts.
  const [saved] = useState(loadState);
  const [chats, setChats] = useState(() => saved?.chats ?? [createChat()]);
  const [activeChatId, setActiveChatId] = useState(() => saved?.activeChatId ?? chats[0].id);
  const [provider, setProvider] = useState(() => saved?.provider ?? "gemini");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];

  // Save chats whenever they change.
  useEffect(() => {
    saveState({ chats, activeChatId, provider });
  }, [chats, activeChatId, provider]);

  function updateChat(chatId, updater) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
  }

  function handleNewChat() {
    const chat = createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setError("");
    setSidebarOpen(false);
  }

  function handleSelectChat(chatId) {
    setActiveChatId(chatId);
    setError("");
    setSidebarOpen(false);
  }

  function handleDeleteChat(chatId) {
    if (isLoading) return;
    if (!window.confirm("Delete this chat?")) return;
    const remaining = chats.filter((c) => c.id !== chatId);
    if (remaining.length === 0) {
      const fresh = createChat();
      setChats([fresh]);
      setActiveChatId(fresh.id);
    } else {
      setChats(remaining);
      if (chatId === activeChat.id) setActiveChatId(remaining[0].id);
    }
    setError("");
  }

  function handleClear() {
    updateChat(activeChat.id, (c) => ({ ...c, title: "New chat", messages: [] }));
    setError("");
  }

  async function handleSend(text) {
    if (isLoading) return;

    const chatId = activeChat.id;
    const userMessage = { id: makeId(), role: "user", content: text };
    const history = [...activeChat.messages, userMessage];

    updateChat(chatId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? makeTitle(text) : c.title,
      messages: history,
    }));
    setError("");
    setIsLoading(true);

    try {
      const reply = await sendChat(provider, history);
      const aiMessage = { id: makeId(), role: "assistant", content: reply, provider };
      updateChat(chatId, (c) => ({ ...c, messages: [...c.messages, aiMessage] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        activeChatId={activeChat.id}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        disabled={isLoading}
      />
      <ChatWindow
        chat={activeChat}
        provider={provider}
        onProviderChange={setProvider}
        onSend={handleSend}
        onClear={handleClear}
        isLoading={isLoading}
        error={error}
        onDismissError={() => setError("")}
        onOpenSidebar={() => setSidebarOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}