import { useState } from "react";
import useTeam from "../hooks/useTeam.js";
import useIsMobile from "../hooks/useIsMobile.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { DEPARTMENTS, DEPARTMENT_OPTIONS } from "../lib/constants.js";
import EmptyState from "./shared/EmptyState.jsx";

const UNASSIGNED = { label: "Unassigned", color: "#9ca3af", bg: "#f3f2ef" };

const inputStyle = {
  width: "100%", padding: "10px 12px", background: "#f5f4f1",
  border: "1px solid #e5e5e0", borderRadius: 10,
  color: "#1a1a1a", fontSize: 13, boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "#6b7280",
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
};

function TeamMembersEditor({ members, onChange }) {
  const [name, setName] = useState("");
  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) { setName(""); return; }
    onChange([...members, trimmed]);
    setName("");
  };
  const remove = (n) => onChange(members.filter(m => m !== n));
  return (
    <div>
      <div style={{
        minHeight: 44, padding: "8px 10px", background: "#f5f4f1",
        border: "1px solid #e5e5e0", borderRadius: 10,
        display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8,
      }}>
        {members.length === 0 && (
          <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>(empty — add people below)</span>
        )}
        {members.map(n => (
          <span key={n} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#fff", border: "1px solid #e5e5e0",
            borderRadius: 16, padding: "4px 10px",
            fontSize: 12, fontWeight: 600, color: "#1a1a1a",
          }}>
            {n}
            <button onClick={() => remove(n)} style={{
              background: "none", border: "none", color: "#9ca3af",
              cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1,
            }} title="Remove">✕</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Enter name"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={add} style={{
          padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e5e0",
          background: "#1a1a1a", color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>+ Add</button>
      </div>
    </div>
  );
}

function DepartmentAccountModal({ mode, member, onClose, onSubmit, mob }) {
  const isCreate = mode === "create";
  const [department, setDepartment] = useState(member?.department || "");
  const [email, setEmail] = useState(member?.email || "");
  const [password, setPassword] = useState("");
  const [teamMembers, setTeamMembers] = useState(Array.isArray(member?.team_members) ? member.team_members : []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (isCreate) {
      if (!department) { setError("Please fill required fields : Department"); return; }
      if (!email.trim()) { setError("Email is required"); return; }
      if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
      if (teamMembers.length === 0) { setError("Add at least one team member"); return; }
    } else {
      if (!department) { setError("Please fill required fields : Department"); return; }
    }
    setBusy(true);
    try {
      await onSubmit({ department, email: email.trim(), password, teamMembers });
    } catch (e) {
      setError(e.message || "Something went wrong");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <div
      onClick={busy ? null : onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, width: "100%", maxWidth: 480,
          padding: mob ? 22 : 28, boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 17 : 19, margin: 0 }}>
            {isCreate ? "Create Department Account" : "Edit Department Account"}
          </h3>
          <button onClick={onClose} disabled={busy} style={{
            background: "none", border: "none", color: "#9ca3af",
            fontSize: 22, cursor: busy ? "default" : "pointer", padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Department</div>
          <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
            <option value="">-- Select Department --</option>
            {DEPARTMENT_OPTIONS.map(d => (
              <option key={d} value={d}>{DEPARTMENTS[d].label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Login Email</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="venue@ambria.in"
            disabled={!isCreate}
            style={{ ...inputStyle, opacity: isCreate ? 1 : 0.6 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Password{!isCreate ? " (cannot be changed here)" : ""}</div>
          {isCreate ? (
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={inputStyle}
              autoComplete="new-password"
            />
          ) : (
            <div style={{
              padding: "10px 12px", background: "#f8f8f6", border: "1px dashed #e5e5e0",
              borderRadius: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.5,
            }}>
              To change this account's password, delete it and create a new one with the same email.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={labelStyle}>Team Members</div>
          <TeamMembersEditor members={teamMembers} onChange={setTeamMembers} />
        </div>

        {error && (
          <div style={{
            marginBottom: 14, padding: "9px 12px", borderRadius: 10,
            background: "rgba(239,83,80,0.08)", color: "#dc2626", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={busy} style={{
            padding: "10px 18px", borderRadius: 10, border: "1px solid #e5e5e0",
            background: "#f5f4f1", color: "#6b7280", fontSize: 13, fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{
            padding: "10px 22px", borderRadius: 10, border: "none",
            background: busy ? "#9ca3af" : "#1a1a1a", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer",
          }}>{busy ? "Saving…" : (isCreate ? "Create Account" : "Save Changes")}</button>
        </div>
      </div>
    </div>
  );
}

export default function TeamView() {
  const { user } = useAuth();
  const {
    members, loading, error,
    createDepartmentAccount, updateDepartmentProfile, deleteMember,
  } = useTeam();
  const mob = useIsMobile();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [removedNote, setRemovedNote] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleCreate = async ({ department, email, password, teamMembers }) => {
    await createDepartmentAccount({ department, email, password, teamMembers });
    setCreateOpen(false);
    setActionMessage(`${DEPARTMENTS[department].label} account created — they can sign in with ${email}.`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleEdit = async ({ department, teamMembers }) => {
    if (!editTarget) return;
    await updateDepartmentProfile(editTarget.id, { department, teamMembers });
    setEditTarget(null);
    setActionMessage("Account updated.");
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleDelete = async (member) => {
    const dept = DEPARTMENTS[member.department]?.label || member.full_name || member.email;
    if (!confirm(`Delete ${dept} account? They won't be able to log in anymore.`)) return;
    try {
      const name = member.full_name || member.email;
      await deleteMember(member.id);
      setRemovedNote(name);
      setTimeout(() => setRemovedNote(null), 6000);
    } catch (e) {
      alert("Failed to remove account: " + e.message);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading team...</div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 18 : 22, margin: 0 }}>
            👥 Team
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
            One login per department. Each login is shared by the team listed below it.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{
          padding: "10px 18px", borderRadius: 10, border: "none",
          background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: "pointer", ...(mob ? { width: "100%" } : {}),
        }}>+ Add Department</button>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,83,80,0.08)", color: "#dc2626", padding: "10px 16px",
          borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {actionMessage && (
        <div style={{
          background: "rgba(34,197,94,0.08)", color: "#16a34a", padding: "10px 16px",
          borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>
          {actionMessage}
        </div>
      )}

      {removedNote && (
        <div style={{
          background: "rgba(255,179,0,0.08)", color: "#92750a", padding: "10px 16px",
          borderRadius: 10, fontSize: 12, marginBottom: 16, lineHeight: 1.5,
        }}>
          {removedNote} removed. Auth account still exists in Supabase — go to <strong>Supabase Dashboard → Authentication → Users</strong> to fully delete it.
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState msg="No accounts yet. Click '+ Add Department' to create the first one." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map(m => {
            const dept = m.department || "";
            const badge = DEPARTMENTS[dept] || UNASSIGNED;
            const isCurrentUser = m.id === user?.id;
            const teamList = Array.isArray(m.team_members) ? m.team_members : [];

            return (
              <div key={m.id} style={{
                background: "#fff", border: "1px solid #eeeee9", borderRadius: 14,
                padding: mob ? "14px 16px" : "16px 22px",
                borderLeft: `4px solid ${badge.color}`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: badge.color, display: "inline-block" }} />
                      <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: mob ? 15 : 16, color: "#1a1a1a" }}>
                        {DEPARTMENTS[dept]?.label || (m.full_name || "Unassigned")}
                      </span>
                      {isCurrentUser && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: "#f3f2ef", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5,
                        }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                      {m.email || "—"}
                    </div>
                    {teamList.length > 0 ? (
                      <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                        <span style={{ color: "#9ca3af", fontWeight: 600 }}>Members: </span>
                        {teamList.join(", ")}
                      </div>
                    ) : !isCurrentUser ? (
                      <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginBottom: 6 }}>
                        No team members listed
                      </div>
                    ) : null}
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Created {formatDate(m.created_at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditTarget(m)}
                      title="Edit"
                      style={{
                        background: "none", border: "1px solid #e5e5e0", borderRadius: 8,
                        width: 36, height: 36, cursor: "pointer", color: "#6b7280", fontSize: 14,
                      }}
                    >✏️</button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDelete(m)}
                        title="Delete"
                        style={{
                          background: "none", border: "1px solid #fecaca", borderRadius: 8,
                          width: 36, height: 36, cursor: "pointer", color: "#dc2626", fontSize: 14,
                        }}
                      >🗑</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: 24, padding: "14px 18px", background: "#f8f8f6",
        border: "1px solid #eeeee9", borderRadius: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.6,
      }}>
        <strong>How this works:</strong> One login per department, shared by the people listed under it. Admin and Creative get the full app; Venue, Catering, Decor, and Entertainment see only the simplified Ad Requests page.
      </div>

      {createOpen && (
        <DepartmentAccountModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          mob={mob}
        />
      )}
      {editTarget && (
        <DepartmentAccountModal
          mode="edit"
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          mob={mob}
        />
      )}
    </div>
  );
}
