const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Google Gemini" },
];

export default function ProviderSelect({ value, onChange, disabled }) {
  return (
    <label className="provider">
      <span className="provider-label">Provider</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {PROVIDERS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  );
}