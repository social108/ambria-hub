export default function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "rgba(255,255,255,0.25)" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
