import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) return (
    <div style={{
      background: "#08080e", minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "#666", fontFamily: "sans-serif",
    }}>
      Loading...
    </div>
  );

  return session ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
