export default function FieldError({ children }) {
  if (!children) return null;
  return <div style={{ fontSize: 11, color: "#dc2626", marginTop: 5, fontWeight: 600 }}>{children}</div>;
}
