import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import useIsMobile from "../hooks/useIsMobile.js";
import logo from "../assets/logo.png";

export default function AccessDenied() {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const mob = useIsMobile();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1a1a1a" }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56,
        background: "#ffffff", borderBottom: "1px solid #eeeee9",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>SMO CALENDAR</span>
        </div>
      </nav>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: mob ? "40px 16px" : "80px 24px" }}>
        <div style={{
          width: "100%", maxWidth: 420, background: "#ffffff",
          border: "1px solid #eeeee9", borderRadius: 20,
          padding: mob ? "28px 22px" : "36px 32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)", textAlign: "center",
        }}>
          <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 20 : 22, fontWeight: 800, margin: "0 0 10px" }}>
            Access denied
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 22px" }}>
            Contact your admin.
          </p>
          <button
            onClick={async () => { setBusy(true); try { await signOut(); } catch { setBusy(false); } }}
            disabled={busy}
            style={{
              padding: "10px 22px", borderRadius: 10, border: "none",
              background: "#1a1a1a", color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "..." : "Logout"}
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: "#9ca3af" }}>
        Ambria · Get Your Venue Events Pvt Ltd
      </div>
    </div>
  );
}
