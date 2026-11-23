export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
  disabled,
}) {
  return (
    <>
      {isOpen && <div className="backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="brand">SmartAI</span>
        </div>
        <button className="btn btn-primary" onClick={onNewChat} disabled={disabled}>
          + New chat
        </button>
        <nav className="chat-list" aria-label="Chat history">
          {chats.map((chat) => (
            <div className="chat-row" key={chat.id}>
              <button
                className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
                disabled={disabled}
                title={chat.title}
              >
                {chat.title}
              </button>
              <button
                className="icon-btn chat-delete"
                onClick={() => onDeleteChat(chat.id)}
                disabled={disabled}
                aria-label={`Delete chat: ${chat.title}`}
                title="Delete chat"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}