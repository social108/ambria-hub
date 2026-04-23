import { useState } from "react";
import useTeam from "../hooks/useTeam.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import EmptyState from "./shared/EmptyState.jsx";

const ROLE_BADGES = {
  admin: { label: "Admin", bg: "#1a1a1a", color: "#fff" },
  creative: { label: "Creative", bg: "#3b82f6", color: "#fff" },
  venue_manager: { label: "Venue Manager", bg: "#22c55e", color: "#fff" },
  viewer: { label: "Viewer", bg: "#9ca3af", color: "#fff" },
};

const ROLE_OPTIONS = [
  { id: "admin", label: "Admin" },
  { id: "creative", label: "Creative Team" },
  { id: "venue_manager", label: "Venue Manager" },
  { id: "viewer", label: "Viewer" },
];

export default function TeamView() {
  const { user } = useAuth();
  const { members, loading, error, updateMemberRole, deleteMember } = useTeam();
  const mob = useIsMobile();
  const [savedId, setSavedId] = useState(null); // flash "Saved" indicator
  const [removedNote, setRemovedNote] = useState(null); // auth note after removal

  const handleRoleChange = async (memberId, newRole) => {
    setSavedId(null);
    try {
      await updateMemberRole(memberId, newRole);
      setSavedId(memberId);
      setTimeout(() => setSavedId(null), 1500);
    } catch (e) {
      alert("Failed to update role: " + e.message);
    }
  };

  const handleDelete = async (member) => {
    const name = member.full_name || member.email;
    if (!confirm(`Remove ${name} from the team? They won't be able to use the app.`)) return;
    try {
      await deleteMember(member.id);
      setRemovedNote(name);
      setTimeout(() => setRemovedNote(null), 6000);
    } catch (e) {
      alert("Failed to remove user: " + e.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading team...</div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 18 : 22, margin: 0 }}>
          Team Members
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,83,80,0.08)", color: "#dc2626", padding: "10px 16px",
          borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Auth note after removal */}
      {removedNote && (
        <div style={{
          background: "rgba(255,179,0,0.08)", color: "#92750a", padding: "10px 16px",
          borderRadius: 10, fontSize: 12, marginBottom: 16, lineHeight: 1.5,
        }}>
          {removedNote} removed from team. Their auth account still exists in Supabase — go to <strong>Supabase Dashboard &rarr; Authentication &rarr; Users</strong> to fully delete it.
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState msg="No team members yet. Share the sign-up link with your team!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map(m => {
            const badge = ROLE_BADGES[m.role] || ROLE_BADGES.viewer;
            const isCurrentUser = m.id === user?.id;
            const justSaved = savedId === m.id;

            return (
              <div key={m.id} style={{
                background: "#fff", border: "1px solid #eeeee9", borderRadius: 12,
                padding: mob ? "14px 14px" : "16px 22px",
                display: "flex", alignItems: mob ? "flex-start" : "center",
                flexDirection: mob ? "column" : "row", gap: mob ? 10 : 16,
              }}>
                {/* Avatar + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: badge.bg, color: badge.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15, flexShrink: 0, fontFamily: "'Sora'",
                  }}>
                    {(m.full_name || m.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 14, color: "#1a1a1a",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {m.full_name || "Unnamed"}{isCurrentUser ? " (you)" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>
                      Joined {formatDate(m.created_at)}
                    </div>
                  </div>
                </div>

                {/* Role dropdown + saved flash */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {isCurrentUser ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6,
                      background: badge.bg, color: badge.color,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {badge.label}
                    </span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: "1px solid #e5e5e0", background: badge.bg, color: badge.color,
                        cursor: "pointer",
                      }}
                    >
                      {ROLE_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  )}
                  {justSaved && (
                    <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, animation: "fadeIn 0.2s ease" }}>
                      Saved ✓
                    </span>
                  )}
                </div>

                {/* Remove button */}
                {!isCurrentUser && (
                  <button
                    onClick={() => handleDelete(m)}
                    style={{
                      background: "none", border: "none", color: "#d1d5db",
                      fontSize: 16, cursor: "pointer", padding: "4px 8px",
                      transition: "color 0.2s", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.target.style.color = "#dc2626"; }}
                    onMouseLeave={e => { e.target.style.color = "#d1d5db"; }}
                    title="Remove from team"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div style={{
        marginTop: 24, padding: "14px 18px", background: "#f8f8f6",
        border: "1px solid #eeeee9", borderRadius: 12, fontSize: 12, color: "#9ca3af", lineHeight: 1.6,
      }}>
        Team members sign up at the login page. Change their role here. Default role is Viewer (read-only).
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
