
import CopyButton from "./CopyButton";

export default function CodeBlock({ children }) {
  const codeElement = Array.isArray(children) ? children[0] : children;

  const className = codeElement?.props?.className || "";
  const language =
    /language-([\w-]+)/.exec(className)?.[1] ?? "";

  const code = String(
    codeElement?.props?.children ?? ""
  ).replace(/\n$/, "");

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language || "code"}</span>
        <CopyButton text={code} label="Copy code" />
      </div>

      <div className="code-scroll">
        <pre>
          <code className={className}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
