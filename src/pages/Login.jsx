import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, fullName);
        setSuccess("Account created! You can now sign in.");
        setMode("signin");
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "9px 0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: active ? "rgba(201,168,76,0.2)" : "transparent",
    color: active ? "#C9A84C" : "rgba(255,255,255,0.45)",
    transition: "all 0.2s",
  });

  return (
    <div style={{
      background: "#08080e",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "40px 32px 32px",
        background: "rgba(255,255,255,0.02)",
      }}>
        {/* Logo */}
        <div style={{
          textAlign: "center",
          marginBottom: 28,
          fontFamily: "'Outfit'",
          fontWeight: 800,
          fontSize: 26,
          background: "linear-gradient(135deg,#C9A84C,#F6AD55)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          AMBRIA HUB
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }} style={tabStyle(mode === "signin")}>Sign In</button>
          <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} style={tabStyle(mode === "signup")}>Sign Up</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && <div style={{ color: "#EF5350", fontSize: 13 }}>{error}</div>}
          {success && <div style={{ color: "#66BB6A", fontSize: 13 }}>{success}</div>}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "12px 0",
              border: "none",
              borderRadius: 8,
              cursor: busy ? "default" : "pointer",
              fontSize: 14,
              fontWeight: 700,
              background: "linear-gradient(135deg,#C9A84C,#F6AD55)",
              color: "#000",
              opacity: busy ? 0.6 : 1,
              transition: "opacity 0.2s",
              marginTop: 4,
            }}
          >
            {busy
              ? mode === "signin" ? "Signing in..." : "Creating account..."
              : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: 32,
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
        }}>
          Ambria &middot; Get Your Venue Events Pvt Ltd
        </div>
      </div>
    </div>
  );
}
