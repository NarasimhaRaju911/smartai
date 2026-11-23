export default function LoadingDots() {
  return (
    <div className="message assistant" role="status" aria-label="SmartAI is thinking">
      <div className="bubble loading">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}