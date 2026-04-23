import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useIsMobile from "../hooks/useIsMobile.js";
import logo from "../assets/logo.png";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const mob = useIsMobile();

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
    padding: mob ? "12px 14px" : "12px 14px",
    background: "#f5f4f1",
    border: "1px solid #e5e5e0",
    borderRadius: 10,
    color: "#1a1a1a",
    fontSize: 16, // prevents iOS zoom
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    minHeight: 44,
    boxSizing: "border-box",
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: active ? "#1a1a1a" : "transparent",
    color: active ? "#fff" : "#9ca3af",
    transition: "all 0.2s",
    minHeight: 44,
  });

  return (
    <div style={{
      background: "#F7F6F3",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: mob ? "20px 12px" : 0,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        border: "1px solid #eeeee9",
        borderRadius: 20,
        padding: mob ? "28px 20px 24px" : "40px 32px 32px",
        background: "#ffffff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: mob ? 22 : 28 }}>
          <div style={{ width: mob ? 64 : 80, height: mob ? 64 : 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
            <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 16 : 18, color: "#1a1a1a", letterSpacing: 2, marginTop: 12 }}>AMBRIA HUB</div>
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

          {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}
          {success && <div style={{ color: "#16a34a", fontSize: 13 }}>{success}</div>}

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              cursor: busy ? "default" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              background: "#1a1a1a",
              color: "#fff",
              opacity: busy ? 0.6 : 1,
              transition: "opacity 0.2s",
              marginTop: 4,
              minHeight: 48,
              width: "100%",
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
          marginTop: mob ? 24 : 32,
          fontSize: 11,
          color: "#9ca3af",
        }}>
          Ambria &middot; Get Your Venue Events Pvt Ltd
        </div>
      </div>
    </div>
  );
}
