export default function InputField({ label, value, onChange, placeholder, type = "text", error }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", padding: "9px 12px", background: "#f5f4f1", border: `1px solid ${error ? "#dc2626" : "#e5e5e0"}`,
        borderRadius: 10, color: "#1a1a1a", fontSize: 13,
      }} />
      {error && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5, fontWeight: 600 }}>{error}</div>}
    </div>
  );
}
