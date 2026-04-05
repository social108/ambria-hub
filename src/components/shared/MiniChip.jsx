export default function MiniChip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 6, border: `1px solid ${active ? (color || "#1a1a1a") : "#e5e5e0"}`,
      background: active ? `${color || "#1a1a1a"}15` : "#ffffff",
      color: active ? (color || "#1a1a1a") : "#9ca3af",
      fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}
