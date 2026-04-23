import { useState } from "react";
import { TEAM_ROLES } from "../lib/constants.js";
import useTeam from "../hooks/useTeam.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import InputField from "./shared/InputField.jsx";
import FieldLabel from "./shared/FieldLabel.jsx";
import EmptyState from "./shared/EmptyState.jsx";

const ROLE_OPTIONS = Object.entries(TEAM_ROLES).map(([id, r]) => ({ id, label: r.label }));

const EMPTY_INVITE = { fullName: "", email: "", password: "", role: "creative" };

export default function TeamView() {
  const { user } = useAuth();
  const { members, loading, error, inviteMember, updateMemberRole } = useTeam();
  const mob = useIsMobile();

  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_INVITE });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [editingRole, setEditingRole] = useState(null); // member id being edited

  const handleSubmit = async () => {
    setFormError(null);
    setFormSuccess(null);
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("All fields are required");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await inviteMember(form);
      setFormSuccess(`${form.fullName} has been invited!`);
      setForm({ ...EMPTY_INVITE });
      setTimeout(() => { setShowInvite(false); setFormSuccess(null); }, 1500);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      setEditingRole(null);
    } catch (e) {
      alert("Failed to update role: " + e.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading team...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <h2 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 18 : 22, margin: 0 }}>
            Team Members
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setFormError(null); setFormSuccess(null); }}
          style={{
            background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'DM Sans'", letterSpacing: 0.3,
            transition: "background 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "#b8963e"; }}
          onMouseLeave={e => { e.target.style.background = "#C9A84C"; }}
        >
          + Invite Team Member
        </button>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,83,80,0.08)", color: "#dc2626", padding: "10px 16px",
          borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <EmptyState msg="No team members yet. Invite someone to get started!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map(m => {
            const r = TEAM_ROLES[m.role] || TEAM_ROLES.viewer;
            const isCurrentUser = m.id === user?.id;
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
                    background: r.bg, color: r.color,
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

                {/* Role badge / editor */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {editingRole === m.id ? (
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      onBlur={() => setEditingRole(null)}
                      autoFocus
                      style={{
                        padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db",
                        fontSize: 12, background: "#f5f4f1", color: "#1a1a1a", cursor: "pointer",
                      }}
                    >
                      {ROLE_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      onClick={() => !isCurrentUser && setEditingRole(m.id)}
                      title={isCurrentUser ? "Can't change your own role" : "Click to change role"}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: r.bg, color: r.color,
                        textTransform: "uppercase", letterSpacing: 0.5,
                        cursor: isCurrentUser ? "default" : "pointer",
                        transition: "opacity 0.2s",
                      }}
                    >
                      {r.label}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0, minWidth: 70 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    background: m.status === "active" ? "rgba(102,187,106,0.12)" : "rgba(255,179,0,0.12)",
                    color: m.status === "active" ? "#2E7D32" : "#92750a",
                    textTransform: "uppercase", letterSpacing: 0.5,
                  }}>
                    {m.status || "active"}
                  </span>
                </div>

                {/* Last login */}
                <div style={{ flexShrink: 0, minWidth: mob ? undefined : 120, textAlign: mob ? "left" : "right" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Last login</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {formatDate(m.last_sign_in)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div
          onClick={() => setShowInvite(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16,
              width: "100%", maxWidth: 440, padding: mob ? 20 : 28,
              boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
              animation: "fadeInUp 0.2s ease-out",
            }}
          >
            <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

            <h3 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 18, margin: "0 0 20px" }}>
              Invite Team Member
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <InputField
                label="Full Name"
                value={form.fullName}
                onChange={v => setForm(f => ({ ...f, fullName: v }))}
                placeholder="e.g. Priya Sharma"
              />
              <InputField
                label="Email"
                type="email"
                value={form.email}
                onChange={v => setForm(f => ({ ...f, email: v }))}
                placeholder="priya@ambria.in"
              />
              <InputField
                label="Initial Password"
                type="password"
                value={form.password}
                onChange={v => setForm(f => ({ ...f, password: v }))}
                placeholder="Min 6 characters"
              />

              <div>
                <FieldLabel>Role</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ROLE_OPTIONS.map(o => {
                    const rc = TEAM_ROLES[o.id];
                    const sel = form.role === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: o.id }))}
                        style={{
                          padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: sel ? `2px solid ${rc.color}` : "1px solid #e5e5e0",
                          background: sel ? rc.bg : "#f5f4f1",
                          color: sel ? rc.color : "#9ca3af",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                  {TEAM_ROLES[form.role]?.desc}
                </div>
              </div>
            </div>

            {formError && (
              <div style={{
                background: "rgba(239,83,80,0.08)", color: "#dc2626",
                padding: "8px 12px", borderRadius: 8, fontSize: 12, marginTop: 14,
              }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{
                background: "rgba(102,187,106,0.12)", color: "#2E7D32",
                padding: "8px 12px", borderRadius: 8, fontSize: 12, marginTop: 14,
              }}>
                {formSuccess}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowInvite(false); setForm({ ...EMPTY_INVITE }); }}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e5e0",
                  background: "#f5f4f1", color: "#6b7280", fontSize: 13,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "9px 22px", borderRadius: 8, border: "none",
                  background: submitting ? "#d1d5db" : "#C9A84C",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
