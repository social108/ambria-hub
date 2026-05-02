import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DepartmentView from "./pages/DepartmentView.jsx";
import WaitingScreen from "./pages/WaitingScreen.jsx";

function AppContent() {
  const { session, loading, department } = useAuth();

  if (loading) return (
    <div style={{
      background: "#F7F6F3", minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "#9ca3af", fontFamily: "sans-serif",
    }}>
      Loading...
    </div>
  );

  if (!session) return <Login />;
  if (!department) return <WaitingScreen />;
  if (department === "admin" || department === "creative") return <Dashboard />;
  return <DepartmentView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
