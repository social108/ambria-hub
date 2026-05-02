import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { PAGES, AD_REQUEST_STATUS, DEPARTMENTS } from "../lib/constants.js";
import { formatDate } from "../lib/helpers.js";
import useAdRequests from "../hooks/useAdRequests.js";
import useRealtimeSync from "../hooks/useRealtimeSync.js";
import useIsMobile from "../hooks/useIsMobile.js";
import Chip from "../components/shared/Chip.jsx";
import InputField from "../components/shared/InputField.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";
import logo from "../assets/logo.png";

function normalizeStatus(s) {
  if (s === "rejected") return "rejected";
  if (s === "pending" || s === "requested" || !s) return "pending";
  return "approved";
}

const noop = () => {};

export default function DepartmentView() {
  const { user, department, teamMembers, signOut } = useAuth();
  const mob = useIsMobile();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState({ eventName: "", pages: [], startDate: "", endDate: "", brief: "", requestedBy: "" });
  const [submitError, setSubmitError] = useState("");

  const { adRequests, addAdRequest, loading, refetch } = useAdRequests({ ownerId: user?.id });
  const refetchAds = useCallback(() => refetch(), [refetch]);
  useRealtimeSync({ refetchEvents: noop, refetchWorkflow: noop, refetchAdRequests: refetchAds });

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const deptInfo = DEPARTMENTS[department] || { label: department || "Unassigned", color: "#6b7280", bg: "#f3f2ef" };

  const filtered = useMemo(() => {
    if (statusFilter === "All") return adRequests;
    return adRequests.filter(a => normalizeStatus(a.status) === statusFilter);
  }, [adRequests, statusFilter]);

  const togglePage = (pid) => {
    setForm(f => ({ ...f, pages: f.pages.includes(pid) ? f.pages.filter(p => p !== pid) : [...f.pages, pid] }));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); } catch { setLoggingOut(false); }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!form.eventName.trim()) { setSubmitError("Campaign name is required"); return; }
    if (form.pages.length === 0) { setSubmitError("Select at least one page"); return; }
    if (!form.requestedBy) { setSubmitError("Pick who is requesting this"); return; }
    await addAdRequest({
      ...form,
      createdBy: user?.id,
      department,
    });
    setForm({ eventName: "", pages: [], startDate: "", endDate: "", brief: "", requestedBy: "" });
    setShowForm(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        .dept-filter-row::-webkit-scrollbar { display: none; }
        @keyframes deptFadeSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Top bar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56,
        background: "#ffffff", borderBottom: "1px solid #eeeee9",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>SMO CALENDAR</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: loggingOut ? "default" : "pointer", padding: "4px 8px" }}
        >
          {loggingOut ? "..." : "Logout"}
        </button>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: mob ? "16px 12px 40px" : "28px 24px 60px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 22 : 28, fontWeight: 800, margin: 0 }}>
            Welcome, {deptInfo.label}
          </h1>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: deptInfo.bg, color: deptInfo.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {deptInfo.label}
            </span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{adRequests.length} request{adRequests.length === 1 ? "" : "s"}</span>
          </div>
          {Array.isArray(teamMembers) && teamMembers.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
              <span style={{ color: "#9ca3af", fontWeight: 600 }}>Members: </span>
              {teamMembers.join(", ")}
            </div>
          )}
        </div>

        {/* New request button */}
        <button onClick={() => { setShowForm(s => !s); setSubmitError(""); }} style={{
          padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 700,
          marginBottom: 18, ...(mob ? { width: "100%" } : {}),
        }}>
          {showForm ? "× Close" : "+ New Ad Request"}
        </button>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#f8f8f6", border: "1px solid #e5e5e0", borderRadius: 14, padding: mob ? 16 : 22, marginBottom: 22, animation: "deptFadeSlide 0.2s ease" }}>
            <div style={{ fontFamily: "'Sora'", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>New Ad Request</div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <InputField label="Event / Campaign Name" value={form.eventName} onChange={v => setForm(f => ({ ...f, eventName: v }))} placeholder="e.g. Summer Pool Party" />
              <InputField label="Ad Start Date" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} type="date" />
              <InputField label="Ad End Date" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} type="date" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Requested By</div>
                <select
                  value={form.requestedBy}
                  onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 12px", background: "#f5f4f1",
                    border: "1px solid #e5e5e0", borderRadius: 10,
                    color: "#1a1a1a", fontSize: 13, minHeight: 44,
                    boxSizing: "border-box", cursor: "pointer",
                  }}
                >
                  <option value="">Select who is requesting</option>
                  {(teamMembers || []).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {(!teamMembers || teamMembers.length === 0) && (
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
                    No team members on file — ask admin to add them.
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Run Ad On Pages</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(() => { const adIds = PAGES.filter(p => !p.noAds).map(p => p.id); const allSel = adIds.every(id => form.pages.includes(id)); return (
                  <button onClick={() => setForm(f => ({ ...f, pages: allSel ? [] : adIds }))} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    border: allSel ? "1px solid #1a1a1a" : "1px solid #e5e5e0",
                    background: allSel ? "#1a1a1a" : "#ffffff",
                    color: allSel ? "#ffffff" : "#9ca3af",
                  }}>All Pages</button>
                ); })()}
                {PAGES.filter(p => !p.noAds).map(pg => (
                  <button key={pg.id} onClick={() => togglePage(pg.id)} style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: `1px solid ${form.pages.includes(pg.id) ? pg.color : "#e5e5e0"}`,
                    background: form.pages.includes(pg.id) ? `${pg.color}20` : "#ffffff",
                    color: form.pages.includes(pg.id) ? pg.color : "#9ca3af",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  }}>{pg.name}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Brief / Notes</div>
              <textarea
                value={form.brief}
                onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                placeholder="Describe the ad content, target audience, key message..."
                rows={4}
                style={{ width: "100%", minHeight: 80, background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 8, padding: 12, fontSize: 13, resize: "vertical" }}
              />
            </div>
            {submitError && (
              <div style={{ marginBottom: 12, fontSize: 12, color: "#dc2626" }}>{submitError}</div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={handleSubmit} style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "#1a1a1a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                ...(mob ? { flex: 1 } : {}),
              }}>Submit Request</button>
              <button onClick={() => setShowForm(false)} style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e5e0",
                background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer",
                ...(mob ? { flex: 1 } : {}),
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Section heading */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Sora'", fontSize: mob ? 16 : 18, fontWeight: 700, margin: 0 }}>Your Requests</h2>
        </div>

        {/* Filters */}
        <div className="dept-filter-row" style={{
          display: "flex", gap: 6, marginBottom: 16,
          ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
        }}>
          <Chip active={statusFilter === "All"} onClick={() => setStatusFilter("All")} style={{ flexShrink: 0 }}>All</Chip>
          <Chip active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} style={{ flexShrink: 0 }}>Pending</Chip>
          <Chip active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")} style={{ flexShrink: 0 }}>Approved</Chip>
          <Chip active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")} style={{ flexShrink: 0 }}>Rejected</Chip>
        </div>

        {/* List */}
        {loading && <div style={{ padding: 30, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading…</div>}
        {!loading && filtered.length === 0 && (
          <EmptyState msg={statusFilter === "All" ? "No requests yet. Click '+ New Ad Request' to create your first one." : `No ${statusFilter} requests.`} />
        )}
        {[...filtered].reverse().map(req => {
          const norm = normalizeStatus(req.status);
          const stInfo = AD_REQUEST_STATUS[norm];
          return (
            <div key={req.id} style={{
              background: "#ffffff", border: "1px solid #eeeee9",
              borderRadius: 12, padding: mob ? "12px 14px" : "16px 20px", marginBottom: 8,
              borderLeft: `3px solid ${stInfo.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Sora'", fontSize: mob ? 14 : 15, fontWeight: 700 }}>{req.eventName}</span>
                {norm === "pending" && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: stInfo.bg, color: stInfo.color }}>⏳ Pending Review</span>
                )}
                {norm === "approved" && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#dcfce7", color: "#16a34a" }}>✅ Approved · Sent to Workflow</span>
                )}
                {norm === "rejected" && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#fef2f2", color: "#dc2626" }}>❌ Rejected</span>
                )}
              </div>
              <div style={{ display: "flex", gap: mob ? 6 : 12, flexWrap: "wrap", fontSize: mob ? 11 : 12, color: "#6b7280", marginBottom: 8 }}>
                {req.startDate && <span>📅 {formatDate(req.startDate)} → {req.endDate ? formatDate(req.endDate) : "TBD"}</span>}
                <span style={{ color: "#d1d5db" }}>Submitted {new Date(req.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: req.brief ? 8 : 0 }}>
                {(req.pages || []).map(pid => {
                  const pg = PAGES.find(p => p.id === pid);
                  return pg ? <span key={pid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${pg.color}18`, color: pg.color, fontWeight: 600 }}>{pg.name}</span> : null;
                })}
              </div>
              {req.brief && <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, background: "#f5f4f1", padding: "8px 12px", borderRadius: 8 }}>{req.brief}</div>}
              {norm === "rejected" && req.rejectReason && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626", fontStyle: "italic" }}>
                  Reason: "{req.rejectReason}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", padding: "24px 0 32px", fontSize: 11, color: "#9ca3af" }}>
        Ambria · Get Your Venue Events Pvt Ltd
      </div>
    </div>
  );
}
