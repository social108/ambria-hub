import { useState } from "react";
import { PAGES, AD_REQUEST_STATUS } from "../lib/constants.js";
import { formatDate } from "../lib/helpers.js";
import Chip from "./shared/Chip.jsx";
import InputField from "./shared/InputField.jsx";
import EmptyState from "./shared/EmptyState.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

export default function AdRequestsView({ data, addAdRequest, updateAdRequest, deleteAdRequest, role }) {
  const canCreate = role === "admin" || role === "creative" || role === "venue_manager";
  const canChangeStatus = role === "admin" || role === "creative";
  const canDelete = role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventName: "", pages: [], budget: "", startDate: "", endDate: "", brief: "", requestedBy: "" });
  const [statusFilter, setStatusFilter] = useState("All");
  const mob = useIsMobile();

  const filteredAds = statusFilter === "All" ? data.adRequests : data.adRequests.filter(a => a.status === statusFilter);
  const totalBudget = data.adRequests.reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);
  const liveBudget = data.adRequests.filter(a => a.status === "live" || a.status === "approved").reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);

  const handleSubmit = () => {
    if (!form.eventName || form.pages.length === 0 || !form.budget) return;
    addAdRequest(form);
    setForm({ eventName: "", pages: [], budget: "", startDate: "", endDate: "", brief: "", requestedBy: "" });
    setShowForm(false);
  };

  const togglePage = (pid) => {
    setForm(f => ({ ...f, pages: f.pages.includes(pid) ? f.pages.filter(p => p !== pid) : [...f.pages, pid] }));
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

      {/* Budget Overview */}
      <div className="ad-budget-row" style={{
        display: "flex", gap: 10, marginBottom: 16,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        {[
          { label: "Total Requests", val: data.adRequests.length, color: "#C9A84C" },
          { label: "Total Budget", val: `₹${totalBudget.toLocaleString("en-IN")}`, color: "#FFB300" },
          { label: "Active/Approved", val: `₹${liveBudget.toLocaleString("en-IN")}`, color: "#66BB6A" },
        ].map(s => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "8px 12px" : "12px 18px", display: "flex", alignItems: "center", gap: mob ? 6 : 10, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Sora'", fontSize: mob ? 16 : 20, fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: mob ? 9 : 11, color: "#9ca3af", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.label}</span>
          </div>
        ))}
        {PAGES.filter(p => !p.noAds).map(pg => {
          const pageBudget = data.adRequests.filter(a => a.pages?.includes(pg.id)).reduce((s,a) => s + (parseFloat(a.budget) || 0) / (a.pages?.length || 1), 0);
          return pageBudget > 0 ? (
            <div key={pg.id} style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "6px 10px" : "8px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pg.color }} />
              <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{pg.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pg.color }}>₹{Math.round(pageBudget).toLocaleString("en-IN")}</span>
            </div>
          ) : null;
        })}
      </div>

      {/* NEW REQUEST FORM */}
      {showForm && (
        <div style={{ background: "#f8f8f6", border: "1px solid #e5e5e0", borderRadius: 14, padding: mob ? 16 : 24, marginBottom: 20, animation: "fadeSlide 0.2s ease" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ fontSize: 16, fontFamily: "'Sora'", fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>New Ad Request</div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <InputField label="Event / Campaign Name" value={form.eventName} onChange={v => setForm(f => ({...f, eventName: v}))} placeholder="e.g. Diwali Night 2026" />
            <InputField label="Budget (₹)" value={form.budget} onChange={v => setForm(f => ({...f, budget: v}))} placeholder="e.g. 25000" type="number" />
            <InputField label="Ad Start Date" value={form.startDate} onChange={v => setForm(f => ({...f, startDate: v}))} type="date" />
            <InputField label="Ad End Date" value={form.endDate} onChange={v => setForm(f => ({...f, endDate: v}))} type="date" />
            <InputField label="Requested By" value={form.requestedBy} onChange={v => setForm(f => ({...f, requestedBy: v}))} placeholder="e.g. Venue Manager name" />
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
        const stInfo = AD_REQUEST_STATUS[req.status] || AD_REQUEST_STATUS.requested;
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
                  {canChangeStatus ? (
                    <select
                      value={req.status}
                      onChange={(e) => updateAdRequest(req.id, { status: e.target.value })}
                      style={{ fontSize: mob ? 11 : 10, background: stInfo.bg, color: stInfo.color, border: `1px solid ${stInfo.color}30`, borderRadius: 5, padding: mob ? "4px 10px" : "2px 8px", cursor: "pointer", fontWeight: 700, minHeight: mob ? 36 : "auto" }}
                    >
                      {Object.entries(AD_REQUEST_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: mob ? 11 : 10, background: stInfo.bg, color: stInfo.color, border: `1px solid ${stInfo.color}30`, borderRadius: 5, padding: mob ? "4px 10px" : "2px 8px", fontWeight: 700 }}>
                      {stInfo.label}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: mob ? 6 : 12, flexWrap: "wrap", fontSize: mob ? 11 : 12, color: "#6b7280", marginBottom: 8 }}>
                  <span>💰 <strong style={{ color: "#FFB300" }}>₹{parseFloat(req.budget).toLocaleString("en-IN")}</strong></span>
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
                {req.brief && <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, background: "#f5f4f1", padding: "8px 12px", borderRadius: 8 }}>{req.brief}</div>}
              </div>
              {canDelete && <button onClick={() => { if(confirm("Delete this ad request?")) deleteAdRequest(req.id); }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 6, padding: "4px 10px", color: "#EF5350", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>✕</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
