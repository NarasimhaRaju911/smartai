
import { useEffect, useRef } from "react";
import ProviderSelect from "./ProviderSelect";
import WelcomeScreen from "./WelcomeScreen";
import MessageBubble from "./MessageBubble";
import LoadingDots from "./LoadingDots";
import ChatInput from "./ChatInput";

export default function ChatWindow({
  chat,
  provider,
  onProviderChange,
  onSend,
  onClear,
  isLoading,
  error,
  onDismissError,
  onOpenSidebar,
  theme,
  onToggleTheme,
}) {
  const bottomRef = useRef(null);
  const isEmpty = chat.messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length, isLoading, error]);

  return (
    <main className="main">
      <header className="topbar">
        <div className="topbar-main">
          <button
            className="icon-btn menu-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <h1 className="topbar-title">{chat.title || "SmartAI"}</h1>
        </div>

        <div className="topbar-actions">
          <ProviderSelect
            value={provider}
            onChange={onProviderChange}
            disabled={isLoading}
          />

          <button
            className="btn btn-ghost"
            onClick={onClear}
            disabled={isEmpty || isLoading}
          >
            Clear chat
          </button>

          <button
            className="icon-btn theme-btn"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <section className="messages">
        <div className="messages-inner">
          {isEmpty ? (
            <WelcomeScreen onSelectPrompt={onSend} />
          ) : (
            chat.messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                provider={m.provider}
              />
            ))
          )}

          {isLoading && <LoadingDots />}

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button
                className="icon-btn"
                onClick={onDismissError}
                aria-label="Dismiss error"
              >
                x
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </section>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </main>
  );
}
