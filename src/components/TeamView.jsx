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
  const [updatingId, setUpdatingId] = useState(null);

  const handleRoleChange = async (memberId, newRole) => {
    setUpdatingId(memberId);
    try {
      await updateMemberRole(memberId, newRole);
    } catch (e) {
      alert("Failed to update role: " + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (member) => {
    if (!confirm(`Remove ${member.full_name || member.email} from the team? They won't be able to access anything.`)) return;
    try {
      await deleteMember(member.id);
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
          {members.length} member{members.length !== 1 ? "s" : ""} — new signups get "Viewer" role until you change it
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

      {members.length === 0 ? (
        <EmptyState msg="No team members yet. Share the sign-up link with your team!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map(m => {
            const badge = ROLE_BADGES[m.role] || ROLE_BADGES.viewer;
            const isCurrentUser = m.id === user?.id;
            const isUpdating = updatingId === m.id;

            return (
              <div key={m.id} style={{
                background: "#fff", border: "1px solid #eeeee9", borderRadius: 12,
                padding: mob ? "14px 14px" : "16px 22px",
                display: "flex", alignItems: mob ? "flex-start" : "center",
                flexDirection: mob ? "column" : "row", gap: mob ? 10 : 16,
                opacity: isUpdating ? 0.6 : 1, transition: "opacity 0.2s",
              }}>
                {/* Avatar + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: badge.bg, color: badge.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15, flexShrink: 0,
                    fontFamily: "'Sora'",
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
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{m.email}</div>
                  </div>
                </div>

                {/* Joined date */}
                <div style={{ flexShrink: 0, minWidth: mob ? undefined : 110 }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Joined</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDate(m.created_at)}</div>
                </div>

                {/* Role dropdown */}
                <div style={{ flexShrink: 0 }}>
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
                      disabled={isUpdating}
                      style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: "1px solid #e5e5e0", background: badge.bg, color: badge.color,
                        cursor: "pointer", appearance: "auto",
                      }}
                    >
                      {ROLE_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Delete button */}
                {!isCurrentUser && (
                  <button
                    onClick={() => handleDelete(m)}
                    style={{
                      background: "none", border: "none", color: "#9ca3af",
                      fontSize: 12, cursor: "pointer", padding: "4px 8px",
                      transition: "color 0.2s", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.target.style.color = "#dc2626"; }}
                    onMouseLeave={e => { e.target.style.color = "#9ca3af"; }}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
