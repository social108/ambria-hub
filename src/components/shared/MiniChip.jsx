export default function MiniChip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 6, border: `1px solid ${active ? (color || "rgba(201,168,76,0.5)") : "rgba(255,255,255,0.06)"}`,
      background: active ? `${color || "rgba(201,168,76,1)"}15` : "rgba(255,255,255,0.02)",
      color: active ? (color || "#C9A84C") : "rgba(255,255,255,0.4)",
      fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}
