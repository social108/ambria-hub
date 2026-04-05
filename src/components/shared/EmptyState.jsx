export default function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#d1d5db" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
