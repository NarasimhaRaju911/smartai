import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../utils/clipboard";

export default function CopyButton({ text, label = "Copy" }) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    setStatus(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  const caption = status === "copied" ? "Copied!" : status === "failed" ? "Copy failed" : label;

  return (
    <button type="button" className="copy-btn" onClick={handleCopy}>
      {caption}
    </button>
  );
}