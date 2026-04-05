export default function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? "#1a1a1a" : "#e5e5e0"}`,
      background: active ? "rgba(26,26,26,0.08)" : "#ffffff",
      color: active ? "#1a1a1a" : "#9ca3af",
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}
