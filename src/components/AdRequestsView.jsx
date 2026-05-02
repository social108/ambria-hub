import { useState, useMemo, useEffect } from "react";
import { PAGES, AD_REQUEST_STATUS, DEPARTMENTS } from "../lib/constants.js";
import { formatDate } from "../lib/helpers.js";
import { supabase } from "../supabaseClient.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import Chip from "./shared/Chip.jsx";
import InputField from "./shared/InputField.jsx";
import EmptyState from "./shared/EmptyState.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

// Total budget spent for an ad request, summed across its per-page workflow cards.
// Approved ad requests live under event_key = `ad-${req.id}` with one row per page,
// and each page card on the workflow board has its own budget input.
function getRequestSpent(req, workflowData) {
  if (!workflowData) return 0;
  const pages = workflowData[`ad-${req.id}`];
  if (!pages) return 0;
  return Object.values(pages).reduce((s, p) => s + (parseFloat(p?.budget) || 0), 0);
}

// Map legacy statuses (creative_wip, live, completed, requested) onto the
// new pending/approved/rejected model so old rows still render correctly.
function normalizeStatus(s) {
  if (s === "rejected") return "rejected";
  if (s === "pending" || s === "requested" || !s) return "pending";
  return "approved"; // creative_wip, approved, live, completed
}

export default function AdRequestsView({ data, workflowData, addAdRequest, updateAdRequest, deleteAdRequest, role }) {
  const { user, department } = useAuth();
  const canCreate = role === "admin" || role === "creative" || role === "venue_manager";
  const canDecide = role === "admin" || role === "creative";
  const canDelete = role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventName: "", pages: [], startDate: "", endDate: "", brief: "", requestedBy: "" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [rejectTarget, setRejectTarget] = useState(null); // { id, eventName }
  const [rejectReason, setRejectReason] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [rosters, setRosters] = useState([]); // [{ id, department, team_members }]
  const mob = useIsMobile();

  // Fetch every department's roster once so the Requested By dropdown can list
  // names grouped by department.
  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("id, department, team_members").then(({ data: rows, error }) => {
      if (!active) return;
      if (error) { console.error("rosters fetch error:", error); return; }
      const filtered = (rows || [])
        .filter(r => r.department && Array.isArray(r.team_members) && r.team_members.length > 0);
      setRosters(filtered);
    });
    return () => { active = false; };
  }, []);

  const filteredAds = useMemo(() => {
    if (statusFilter === "All") return data.adRequests;
    return data.adRequests.filter(a => normalizeStatus(a.status) === statusFilter);
  }, [data.adRequests, statusFilter]);

  // Total spent across approved ad requests (from workflow_status budgets)
  const totalSpent = useMemo(() => {
    return data.adRequests
      .filter(a => normalizeStatus(a.status) === "approved")
      .reduce((s, a) => s + getRequestSpent(a, workflowData), 0);
  }, [data.adRequests, workflowData]);

  const handleSubmit = () => {
    if (!form.eventName || form.pages.length === 0) return;
    addAdRequest({ ...form, createdBy: user?.id, department });
    setForm({ eventName: "", pages: [], startDate: "", endDate: "", brief: "", requestedBy: "" });
    setShowForm(false);
  };

  const togglePage = (pid) => {
    setForm(f => ({ ...f, pages: f.pages.includes(pid) ? f.pages.filter(p => p !== pid) : [...f.pages, pid] }));
  };

  const handleApprove = async (req) => {
    if (approvingId) return; // guard against double-click
    setApprovingId(req.id);
    try {
      await updateAdRequest(req.id, { status: "approved", rejectReason: "" });
      const pages = req.pages || [];
      if (pages.length > 0) {
        const eventKey = `ad-${req.id}`;
        const rows = pages.map(pageId => ({
          event_key: eventKey,
          page_id: pageId,
          status: "pending",
        }));
        // ignoreDuplicates so re-approving never adds a second row per page
        const { error } = await supabase
          .from("workflow_status")
          .upsert(rows, { onConflict: "event_key,page_id", ignoreDuplicates: true });
        if (error) console.error("handleApprove workflow upsert error:", error);
      }
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (req) => {
    setRejectTarget({ id: req.id, eventName: req.eventName });
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    await updateAdRequest(rejectTarget.id, { status: "rejected", rejectReason: rejectReason.trim() });
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <div>
      <style>{`
        .ad-budget-row::-webkit-scrollbar { display: none; }
        .ad-filter-row::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 22 : 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
            Ad Budget & Requests
          </h1>
          <p style={{ fontSize: mob ? 11 : 13, color: "#9ca3af" }}>Venue team submits ad requests → Creative team builds & runs</p>
        </div>
        {canCreate && <button onClick={() => setShowForm(!showForm)} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
          ...(mob ? { width: "100%" } : {}),
        }}>+ New Ad Request</button>}
      </div>

      {/* Budget Overview — single Total Spent stat (entered via workflow board) */}
      <div className="ad-budget-row" style={{
        display: "flex", gap: 10, marginBottom: 16,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        <div style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "10px 14px" : "14px 20px", display: "flex", alignItems: "center", gap: mob ? 8 : 12, flexShrink: 0 }}>
          <span style={{ fontSize: mob ? 16 : 20 }}>💰</span>
          <div>
            <div style={{ fontFamily: "'Sora'", fontSize: mob ? 16 : 22, fontWeight: 700, color: "#FFB300" }}>
              ₹{totalSpent.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: mob ? 9 : 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Total Budget Spent</div>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "8px 12px" : "12px 18px", display: "flex", alignItems: "center", gap: mob ? 6 : 10, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Sora'", fontSize: mob ? 16 : 20, fontWeight: 700, color: "#C9A84C" }}>{data.adRequests.length}</span>
          <span style={{ fontSize: mob ? 9 : 11, color: "#9ca3af", textTransform: "uppercase", whiteSpace: "nowrap" }}>Total Requests</span>
        </div>
      </div>

      {/* NEW REQUEST FORM */}
      {showForm && (
        <div style={{ background: "#f8f8f6", border: "1px solid #e5e5e0", borderRadius: 14, padding: mob ? 16 : 24, marginBottom: 20, animation: "fadeSlide 0.2s ease" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ fontSize: 16, fontFamily: "'Sora'", fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>New Ad Request</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <InputField label="Event / Campaign Name" value={form.eventName} onChange={v => setForm(f => ({...f, eventName: v}))} placeholder="e.g. Diwali Night 2026" />
            <InputField label="Ad Start Date" value={form.startDate} onChange={v => setForm(f => ({...f, startDate: v}))} type="date" />
            <InputField label="Ad End Date" value={form.endDate} onChange={v => setForm(f => ({...f, endDate: v}))} type="date" />
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
                {rosters.map(profile => {
                  const deptInfo = DEPARTMENTS[profile.department];
                  const label = deptInfo ? deptInfo.label : (profile.department.charAt(0).toUpperCase() + profile.department.slice(1) + " Team");
                  return (
                    <optgroup key={profile.id} label={label}>
                      {profile.team_members.map(name => (
                        <option key={`${profile.id}-${name}`} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {rosters.length === 0 && (
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  No team rosters yet — add members on the Team page.
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.2)", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
            💡 Budget is entered later, on the workflow board, once the ad is posted/live.
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
                  padding: "6px 14px", borderRadius: 8, border: `1px solid ${form.pages.includes(pg.id) ? pg.color : "#e5e5e0"}`,
                  background: form.pages.includes(pg.id) ? `${pg.color}20` : "#ffffff",
                  color: form.pages.includes(pg.id) ? pg.color : "#9ca3af",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>{pg.name}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Brief / Notes</div>
            <textarea value={form.brief} onChange={e => setForm(f => ({...f, brief: e.target.value}))} placeholder="Describe the ad content, target audience, key message..." style={{
              width: "100%", minHeight: 80, background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 8, padding: 12, color: "#1a1a1a", fontSize: 13, resize: "vertical",
            }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleSubmit} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", ...(mob ? { flex: 1 } : {}) }}>Submit Request</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e5e0", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer", ...(mob ? { flex: 1 } : {}) }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="ad-filter-row" style={{
        display: "flex", gap: 6, marginBottom: 16,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        <Chip active={statusFilter === "All"} onClick={() => setStatusFilter("All")} style={{ flexShrink: 0 }}>All</Chip>
        {Object.entries(AD_REQUEST_STATUS).map(([k,v]) => <Chip key={k} active={statusFilter === k} onClick={() => setStatusFilter(k)} style={{ flexShrink: 0 }}>{v.label}</Chip>)}
      </div>

      {/* Requests List */}
      {filteredAds.length === 0 && <EmptyState msg="No ad requests yet. Click '+ New Ad Request' to create one." />}
      {[...filteredAds].reverse().map(req => {
        const norm = normalizeStatus(req.status);
        const stInfo = AD_REQUEST_STATUS[norm];
        const showSpent = norm === "approved";
        const spent = showSpent ? getRequestSpent(req, workflowData) : 0;
        return (
          <div key={req.id} style={{
            background: "#ffffff", border: "1px solid #eeeee9",
            borderRadius: 12, padding: mob ? "12px 14px" : "16px 20px", marginBottom: 8,
            borderLeft: `3px solid ${stInfo.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Sora'", fontSize: mob ? 13 : 15, fontWeight: 700, color: "#1a1a1a" }}>{req.eventName}</span>
                  {req.department && DEPARTMENTS[req.department] && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                      background: DEPARTMENTS[req.department].bg, color: DEPARTMENTS[req.department].color,
                      textTransform: "uppercase", letterSpacing: 0.4,
                    }}>
                      {DEPARTMENTS[req.department].shortLabel}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: mob ? 6 : 12, flexWrap: "wrap", fontSize: mob ? 11 : 12, color: "#6b7280", marginBottom: 8 }}>
                  {showSpent && (
                    spent > 0 ? (
                      <span>💰 Total Spent: <strong style={{ color: "#FFB300" }}>₹{spent.toLocaleString("en-IN")}</strong></span>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>💰 Budget: Not yet entered</span>
                    )
                  )}
                  {req.startDate && <span>📅 {formatDate(req.startDate)} → {req.endDate ? formatDate(req.endDate) : "TBD"}</span>}
                  {req.requestedBy && <span>👤 {req.requestedBy}</span>}
                  {!mob && <span style={{ color: "#d1d5db" }}>Created {new Date(req.createdAt).toLocaleDateString("en-IN")}</span>}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: req.brief ? 8 : 0 }}>
                  {(req.pages || []).map(pid => {
                    const pg = PAGES.find(p => p.id === pid);
                    return pg ? <span key={pid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${pg.color}18`, color: pg.color, fontWeight: 600 }}>{pg.name}</span> : null;
                  })}
                </div>
                {req.brief && <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, background: "#f5f4f1", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{req.brief}</div>}

                {/* Action area — buttons for pending, badge for approved/rejected */}
                {norm === "pending" && (
                  canDecide ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={approvingId === req.id}
                        style={{
                          padding: "8px 20px", borderRadius: 8, border: "none",
                          cursor: approvingId === req.id ? "default" : "pointer",
                          background: approvingId === req.id ? "#86efac" : "#22c55e",
                          color: "#fff", fontWeight: 600, fontSize: 13,
                          ...(mob ? { flex: 1 } : {}),
                        }}
                      >{approvingId === req.id ? "Approving…" : "✅ Approve"}</button>
                      <button
                        onClick={() => openRejectModal(req)}
                        disabled={approvingId === req.id}
                        style={{
                          padding: "8px 20px", borderRadius: 8, border: "1px solid #ef4444",
                          cursor: approvingId === req.id ? "default" : "pointer",
                          background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: 13,
                          opacity: approvingId === req.id ? 0.5 : 1,
                          ...(mob ? { flex: 1 } : {}),
                        }}
                      >❌ Reject</button>
                    </div>
                  ) : (
                    <span style={{ padding: "4px 12px", borderRadius: 8, background: stInfo.bg, color: stInfo.color, fontWeight: 700, fontSize: 12 }}>
                      ⏳ {stInfo.label}
                    </span>
                  )
                )}

                {norm === "approved" && (
                  <span style={{ padding: "4px 12px", borderRadius: 8, background: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 12 }}>
                    ✅ Approved · Sent to Workflow
                  </span>
                )}

                {norm === "rejected" && (
                  <div>
                    <span style={{ padding: "4px 12px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 12 }}>
                      ❌ Rejected
                    </span>
                    {req.rejectReason && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626", fontStyle: "italic" }}>
                        Reason: "{req.rejectReason}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              {canDelete && <button onClick={() => { if(confirm("Delete this ad request?")) deleteAdRequest(req.id); }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 6, padding: "4px 10px", color: "#EF5350", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>✕</button>}
            </div>
          </div>
        );
      })}

      {/* REJECT REASON MODAL */}
      {rejectTarget && (
        <div
          onClick={() => setRejectTarget(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
              padding: mob ? 20 : 28, boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
            }}
          >
            <h3 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 18, margin: "0 0 6px" }}>Reject "{rejectTarget.eventName}"</h3>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#9ca3af" }}>The requester will see this reason on the card.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)…"
              rows={4}
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", background: "#f5f4f1",
                border: "1px solid #e5e5e0", borderRadius: 10,
                color: "#1a1a1a", fontSize: 13, resize: "vertical", minHeight: 90,
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
              <button
                onClick={() => setRejectTarget(null)}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e5e0", background: "#f5f4f1", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >Cancel</button>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                style={{
                  padding: "9px 22px", borderRadius: 8, border: "none",
                  background: rejectReason.trim() ? "#dc2626" : "#fca5a5",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: rejectReason.trim() ? "pointer" : "default",
                }}
              >Reject Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
