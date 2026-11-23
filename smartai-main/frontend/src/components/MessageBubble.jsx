import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import CopyButton from "./CopyButton";

const PROVIDER_LABELS = { openai: "OpenAI", gemini: "Gemini" };

// How Markdown elements are drawn. Raw HTML is never rendered (react-markdown escapes it).
const markdownComponents = {
  pre: CodeBlock,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  // Do not load remote images from AI answers: show the description text instead.
  img: ({ alt }) => <span>{alt}</span>,
};

export default function MessageBubble({ role, content, provider }) {
  const isAssistant = role === "assistant";

  return (
    <div className={`message ${role}`}>
      <div className="bubble-wrap">
        {isAssistant && provider && (
          <span className="bubble-label">{PROVIDER_LABELS[provider] ?? provider}</span>
        )}
        {isAssistant ? (
          <div className="bubble markdown">
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </Markdown>
          </div>
        ) : (
          <div className="bubble">{content}</div>
        )}
        {isAssistant && (
          <div className="bubble-actions">
            <CopyButton text={content} label="Copy response" />
          </div>
        )}
      </div>
    </div>
  );
}