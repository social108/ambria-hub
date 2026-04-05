export default function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)"}`,
      background: active ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
      color: active ? "#C9A84C" : "rgba(255,255,255,0.5)",
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}
