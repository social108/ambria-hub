import { useState, useMemo } from "react";
import { PAGES, REMINDER_TYPES, ACTION_TYPES, CAT_OPTIONS, EMPTY_FORM } from "../lib/constants.js";
import { daysUntil, formatDate, getCreativeDeadline, getAdStartDate, getStoryReminder } from "../lib/helpers.js";
import Chip from "./shared/Chip.jsx";
import EmptyState from "./shared/EmptyState.jsx";
import FieldLabel from "./shared/FieldLabel.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

const inputStyle = { width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13 };

export default function RemindersView({ allEvents, data, updateEvent, deleteEvent, resetBuiltin, setTab, role }) {
  const canEdit = role === "admin" || role === "creative";
  const canDelete = role === "admin";
  const [filter, setFilter] = useState("all_upcoming");
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const mob = useIsMobile();

  // Generate all reminders from all events
  const reminders = useMemo(() => {
    const list = [];
    const today = new Date(); today.setHours(0,0,0,0);

    allEvents.forEach(evt => {
      const eventDays = daysUntil(evt.date);
      if (eventDays < -7) return;

      const hasAd = (evt.actions || []).includes("ad");
      const adLead = evt.adLeadDays || 15;

      if ((evt.actions || []).includes("story") || true) {
        const rDate = getStoryReminder(evt.date);
        const rDays = daysUntil(rDate);
        list.push({
          type: "story_reminder", event: evt, date: rDate, daysUntil: rDays, eventDate: evt.date,
          message: `Prepare stories for "${evt.name}" across ${(evt.pages || []).length} pages`,
        });
      }

      if (hasAd) {
        const cDate = getCreativeDeadline(evt.date, adLead);
        const cDays = daysUntil(cDate);
        list.push({
          type: "creative_deadline", event: evt, date: cDate, daysUntil: cDays, eventDate: evt.date,
          message: `Creative team: Ad for "${evt.name}" must be ready. Ad goes live in 10 days.`,
        });
      }

      if (hasAd) {
        const aDate = getAdStartDate(evt.date, adLead);
        const aDays = daysUntil(aDate);
        list.push({
          type: "ad_start", event: evt, date: aDate, daysUntil: aDays, eventDate: evt.date,
          message: `Start running ads for "${evt.name}". Event in ${adLead} days.`,
        });
      }

      list.push({
        type: "event_day", event: evt, date: evt.date, daysUntil: eventDays, eventDate: evt.date,
        message: `"${evt.name}" is ${eventDays === 0 ? "TODAY" : eventDays === 1 ? "TOMORROW" : `in ${eventDays} days`}`,
      });
    });

    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [allEvents]);

  const filtered = useMemo(() => {
    return reminders.filter(r => {
      if (filter === "all_upcoming") return r.daysUntil >= -2 && r.daysUntil <= 30;
      if (filter === "today") return r.daysUntil === 0;
      if (filter === "this_week") return r.daysUntil >= 0 && r.daysUntil <= 7;
      if (filter === "overdue") return r.daysUntil < 0;
      if (filter === "creative") return r.type === "creative_deadline" && r.daysUntil >= -2 && r.daysUntil <= 30;
      if (filter === "ads") return r.type === "ad_start" && r.daysUntil >= -2 && r.daysUntil <= 30;
      if (filter === "stories") return r.type === "story_reminder" && r.daysUntil >= -2 && r.daysUntil <= 30;
      return true;
    });
  }, [reminders, filter]);

  const todayCount = reminders.filter(r => r.daysUntil === 0).length;
  const weekCount = reminders.filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).length;
  const overdueCount = reminders.filter(r => r.daysUntil < 0 && r.daysUntil >= -3).length;

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(r => {
      if (!g[r.date]) g[r.date] = [];
      g[r.date].push(r);
    });
    return g;
  }, [filtered]);

  const priorityLabels = ["Low", "Medium", "High", "Critical"];
  const priorityColors = ["#78909C","#FFB300","#F4511E","#D50000"];

  const openDetail = (r) => {
    setSelectedReminder(r);
    setEditMode(false);
  };

  const closeDetail = () => {
    setSelectedReminder(null);
    setEditMode(false);
    setForm({ ...EMPTY_FORM });
  };

  const startEdit = () => {
    const evt = selectedReminder.event;
    setForm({
      name: evt.name, date: evt.date, cat: evt.cat || "Custom",
      actions: [...(evt.actions || [])], pages: [...(evt.pages || [])],
      priority: evt.priority ?? 2, adLeadDays: evt.adLeadDays || 15, note: evt.note || "",
    });
    setEditMode(true);
  };

  const handleSave = () => {
    if (!form.name || !form.date) return;
    const evt = selectedReminder.event;
    const isBuiltin = !evt.custom;
    updateEvent(evt.id, form, isBuiltin);
    closeDetail();
  };

  const handleDelete = () => {
    const evt = selectedReminder.event;
    const label = evt.custom ? "Delete" : "Hide";
    if (confirm(`${label} "${evt.name}"?${!evt.custom ? " You can restore it later." : ""}`)) {
      deleteEvent(evt.id, !evt.custom);
      closeDetail();
    }
  };

  const handleReset = () => {
    const evt = selectedReminder.event;
    if (!evt.custom && confirm(`Reset "${evt.name}" to defaults? Your edits will be lost.`)) {
      resetBuiltin(evt.id);
      closeDetail();
    }
  };

  const toggleFormAction = (a) => setForm(f => ({ ...f, actions: f.actions.includes(a) ? f.actions.filter(x => x !== a) : [...f.actions, a] }));
  const toggleFormPage = (p) => setForm(f => ({ ...f, pages: f.pages.includes(p) ? f.pages.filter(x => x !== p) : [...f.pages, p] }));

  const goToWorkflow = () => {
    closeDetail();
    setTab("workflow");
  };

  return (
    <div>
      <style>{`
        .reminder-card {
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 12px; padding: ${mob ? "12px 14px" : "14px 18px"}; margin-bottom: 6px;
          transition: all 0.15s; position: relative; overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          cursor: pointer;
        }
        .reminder-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .reminder-card:active { transform: translateY(0); }
        .reminder-card.urgent { border-color: rgba(239,83,80,0.3); background: rgba(239,83,80,0.03); }
        .reminder-card.today-card { border-color: rgba(255,179,0,0.3); background: rgba(255,179,0,0.04); }
        .reminder-card.overdue-card { border-color: rgba(239,83,80,0.3); background: rgba(239,83,80,0.04); }
        .rem-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center;
          animation: remFadeIn 0.2s ease;
        }
        .rem-modal {
          background: #ffffff; border: 1px solid #e5e5e0; border-radius: 20px;
          width: 580px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
          padding: ${mob ? "20px" : "28px"};
          animation: remSlideUp 0.25s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }
        @keyframes remFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes remSlideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .date-divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0 10px; padding-bottom: 6px;
          border-bottom: 1px solid #eeeee9;
        }
        .date-divider-label { font-family: 'Sora'; font-size: 14px; font-weight: 700; color: #374151; }
        .date-divider-sub { font-size: 11px; color: #9ca3af; }
        .reminder-type-icon {
          width: ${mob ? "28px" : "34px"}; height: ${mob ? "28px" : "34px"}; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: ${mob ? "13px" : "16px"}; font-weight: 700; flex-shrink: 0;
        }
        .r-pages { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
        .r-page-dot { font-size: ${mob ? "8px" : "9px"}; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
        .rem-filter-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 22 : 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
          Reminders & Deadlines
        </h1>
        <p style={{ fontSize: mob ? 11 : 13, color: "#9ca3af" }}>Auto-calculated creative deadlines, ad launch dates, and story reminders for every event</p>
      </div>

      {/* Urgency stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {overdueCount > 0 && (
          <div style={{ background: "rgba(239,83,80,0.06)", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "8px 12px" : "10px 16px", display: "flex", alignItems: "center", gap: mob ? 6 : 10 }}>
            <span style={{ fontFamily: "'Sora'", fontSize: mob ? 18 : 22, fontWeight: 700, color: "#EF5350" }}>{overdueCount}</span>
            <span style={{ fontSize: mob ? 10 : 11, color: "#EF5350", textTransform: "uppercase", fontWeight: 600 }}>Overdue</span>
          </div>
        )}
        <div style={{ background: "rgba(255,179,0,0.06)", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "8px 12px" : "10px 16px", display: "flex", alignItems: "center", gap: mob ? 6 : 10 }}>
          <span style={{ fontFamily: "'Sora'", fontSize: mob ? 18 : 22, fontWeight: 700, color: "#C9A84C" }}>{todayCount}</span>
          <span style={{ fontSize: mob ? 10 : 11, color: "#9ca3af", textTransform: "uppercase" }}>Today</span>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: mob ? "8px 12px" : "10px 16px", display: "flex", alignItems: "center", gap: mob ? 6 : 10 }}>
          <span style={{ fontFamily: "'Sora'", fontSize: mob ? 18 : 22, fontWeight: 700, color: "#FFB300" }}>{weekCount}</span>
          <span style={{ fontSize: mob ? 10 : 11, color: "#9ca3af", textTransform: "uppercase" }}>This Week</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, padding: "8px 0", borderBottom: "1px solid #eeeee9" }}>
        {Object.entries(REMINDER_TYPES).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
            <span style={{ color: v.color, fontWeight: 700 }}>{v.icon}</span> {v.label}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rem-filter-row" style={{
        display: "flex", gap: 6, marginBottom: 18,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        {[
          { v: "all_upcoming", l: "All Upcoming" },
          { v: "today", l: "Today" },
          { v: "this_week", l: "This Week" },
          { v: "overdue", l: "⚠ Overdue" },
          { v: "creative", l: "✎ Creative Deadlines" },
          { v: "ads", l: "▲ Ad Launch" },
          { v: "stories", l: "◎ Story Reminders" },
        ].map(f => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)} style={{ flexShrink: 0 }}>{f.l}</Chip>)}
      </div>

      {filtered.length === 0 && <EmptyState msg="No reminders match this filter. You're all caught up!" />}

      {Object.entries(grouped).map(([date, items]) => {
        const d = daysUntil(date);
        const isToday = d === 0;
        const isPast = d < 0;
        const dayLabel = isToday ? "Today" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : isPast ? `${Math.abs(d)} days ago` : `In ${d} days`;

        return (
          <div key={date}>
            <div className="date-divider">
              <span className="date-divider-label" style={{ color: isToday ? "#92400e" : isPast ? "#EF5350" : "#374151" }}>
                {formatDate(date)}
              </span>
              <span className="date-divider-sub">{dayLabel}</span>
              <span className="date-divider-sub">({items.length} item{items.length > 1 ? "s" : ""})</span>
            </div>

            {items.map((r, ri) => {
              const rt = REMINDER_TYPES[r.type];
              const cardClass = `reminder-card ${r.daysUntil === 0 ? "today-card" : ""} ${r.daysUntil < 0 ? "overdue-card" : ""} ${r.daysUntil >= 0 && r.daysUntil <= 2 ? "urgent" : ""}`;

              return (
                <div key={ri} className={cardClass} onClick={() => openDetail(r)}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: rt.color, borderRadius: "3px 0 0 3px" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: mob ? 10 : 14 }}>
                    <div className="reminder-type-icon" style={{ background: `${rt.color}18`, color: rt.color }}>
                      {rt.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: rt.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{rt.label}</span>
                        {r.daysUntil === 0 && <span style={{ fontSize: 9, background: "rgba(255,179,0,0.12)", color: "#92400e", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TODAY</span>}
                        {r.daysUntil < 0 && <span style={{ fontSize: 9, background: "rgba(239,83,80,0.1)", color: "#EF5350", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>OVERDUE</span>}
                        {r.daysUntil === 1 && <span style={{ fontSize: 9, background: "rgba(255,179,0,0.12)", color: "#FFB300", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TOMORROW</span>}
                      </div>
                      <div style={{ fontFamily: "'Sora'", fontSize: mob ? 13 : 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 3 }}>
                        {r.event.name}
                      </div>
                      <div style={{ fontSize: mob ? 11 : 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 4 }}>
                        {r.message}
                      </div>
                      {(r.event.pages || []).length > 0 && (
                        <div className="r-pages">
                          {r.event.pages.map(pid => {
                            const pg = PAGES.find(p => p.id === pid);
                            return pg ? <span key={pid} className="r-page-dot" style={{ background: `${pg.color}15`, color: pg.color }}>{pg.name.replace("Ambria ", "")}</span> : null;
                          })}
                        </div>
                      )}
                      {(r.type === "creative_deadline" || r.type === "ad_start") && (
                        <div style={{ marginTop: 6, display: "flex", gap: mob ? 4 : 10, fontSize: mob ? 9 : 10, color: "#d1d5db", flexWrap: "wrap" }}>
                          <span>✎ Creative by {formatDate(getCreativeDeadline(r.event.date, r.event.adLeadDays || 15))}</span>
                          <span>→</span>
                          <span>▲ Ads from {formatDate(getAdStartDate(r.event.date, r.event.adLeadDays || 15))}</span>
                          <span>→</span>
                          <span>★ Event {formatDate(r.event.date)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", minWidth: 40, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: priorityColors[r.event.priority] || "#78909C", background: `${priorityColors[r.event.priority] || "#78909C"}15`, padding: "2px 8px", borderRadius: 5, marginBottom: 4 }}>
                        P{r.event.priority}
                      </div>
                      <div style={{ fontSize: 10, color: "#d1d5db" }}>{r.event.cat}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* DETAIL / EDIT MODAL */}
      {selectedReminder && (() => {
        const r = selectedReminder;
        const evt = r.event;
        const rt = REMINDER_TYPES[r.type];
        const eventDays = daysUntil(evt.date);
        const countdownText = eventDays === 0 ? "TODAY" : eventDays === 1 ? "Tomorrow" : eventDays === -1 ? "Yesterday" : eventDays < 0 ? `${Math.abs(eventDays)} days ago` : `${eventDays} days away`;
        const hasAd = (evt.actions || []).includes("ad");
        const adLead = evt.adLeadDays || 15;

        return (
          <div className="rem-modal-overlay" onClick={closeDetail}>
            <div className="rem-modal" onClick={e => e.stopPropagation()}>

              {!editMode ? (
                /* ---- DETAIL VIEW ---- */
                <div>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Sora'", fontSize: mob ? 18 : 22, fontWeight: 800, color: "#1a1a1a", marginBottom: 6 }}>
                        {evt.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: mob ? 12 : 14, color: "#6b7280" }}>
                          {formatDate(evt.date)} · <strong style={{ color: eventDays <= 0 ? "#EF5350" : eventDays <= 3 ? "#FFB300" : "#374151" }}>{countdownText}</strong>
                        </span>
                      </div>
                    </div>
                    <button onClick={closeDetail} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer", padding: "0 4px" }}>✕</button>
                  </div>

                  {/* Badges row */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: `${priorityColors[evt.priority]}18`, color: priorityColors[evt.priority] }}>
                      {priorityLabels[evt.priority] || "Low"} Priority
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, background: "#f3f2ef", color: "#6b7280" }}>
                      {evt.cat}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: `${rt.color}18`, color: rt.color }}>
                      {rt.icon} {rt.label}
                    </span>
                    {eventDays === 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "rgba(255,179,0,0.12)", color: "#92400e" }}>TODAY</span>}
                    {eventDays < 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "rgba(239,83,80,0.1)", color: "#EF5350" }}>OVERDUE</span>}
                  </div>

                  {/* Note / Action plan */}
                  {evt.note && (
                    <div style={{ background: "#f8f8f6", border: "1px solid #eeeee9", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Action Plan</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{evt.note}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Actions</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(evt.actions || []).map(a => {
                        const at = ACTION_TYPES[a];
                        return at ? (
                          <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: at.bg, color: at.color }}>
                            {at.icon} {at.label}
                          </span>
                        ) : null;
                      })}
                      {(evt.actions || []).length === 0 && <span style={{ fontSize: 12, color: "#d1d5db" }}>No actions assigned</span>}
                    </div>
                  </div>

                  {/* Pages */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Assigned Pages</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(evt.pages || []).map(pid => {
                        const pg = PAGES.find(p => p.id === pid);
                        return pg ? (
                          <span key={pid} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: `${pg.color}18`, color: pg.color }}>
                            {pg.name.replace("Ambria ", "")}
                          </span>
                        ) : null;
                      })}
                      {(evt.pages || []).length === 0 && <span style={{ fontSize: 12, color: "#d1d5db" }}>No pages assigned</span>}
                    </div>
                  </div>

                  {/* Ad Timeline */}
                  {hasAd && (
                    <div style={{ background: "#f8f8f6", border: "1px solid #eeeee9", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Ad Timeline</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { icon: "✎", label: "Creative Deadline", date: getCreativeDeadline(evt.date, adLead), color: "#F48FB1" },
                          null,
                          { icon: "▲", label: "Ads Go Live", date: getAdStartDate(evt.date, adLead), color: "#FFB300" },
                          null,
                          { icon: "★", label: "Event Day", date: evt.date, color: "#E65100" },
                        ].map((step, i) => step === null ? (
                          <span key={i} style={{ color: "#d1d5db", fontSize: 14 }}>→</span>
                        ) : (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: `${step.color}12`, padding: "6px 12px", borderRadius: 8 }}>
                            <span style={{ color: step.color, fontWeight: 700 }}>{step.icon}</span>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: step.color }}>{step.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{formatDate(step.date)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
                    {canEdit && <button onClick={startEdit} style={{
                      padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
                      ...(mob ? { flex: 1 } : {}),
                    }}>Edit Event</button>}
                    <button onClick={goToWorkflow} style={{
                      padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e5e0",
                      background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer", fontWeight: 600,
                      ...(mob ? { flex: 1 } : {}),
                    }}>Go to Workflow</button>
                    <button onClick={closeDetail} style={{
                      padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e5e0",
                      background: "transparent", color: "#9ca3af", fontSize: 13, cursor: "pointer",
                      ...(mob ? { flex: 1 } : {}),
                    }}>Close</button>
                  </div>
                </div>
              ) : (
                /* ---- EDIT VIEW ---- */
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontFamily: "'Sora'", fontSize: mob ? 18 : 20, fontWeight: 700, color: "#1a1a1a" }}>Edit Event</div>
                      {!evt.custom && (
                        <span style={{ fontSize: 10, background: "rgba(66,165,245,0.12)", color: "#42A5F5", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Built-in</span>
                      )}
                      {evt.custom && (
                        <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#C9A84C", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Custom</span>
                      )}
                    </div>
                    <button onClick={() => setEditMode(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>✕</button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div style={mob ? {} : { gridColumn: "1 / -1" }}>
                      <FieldLabel>Event Name</FieldLabel>
                      <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Dussehra Mega Night" style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel>Date</FieldLabel>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select value={form.cat} onChange={e => setForm(f => ({...f, cat: e.target.value}))} style={inputStyle}>
                        {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Priority</FieldLabel>
                      <select value={form.priority} onChange={e => setForm(f => ({...f, priority: parseInt(e.target.value)}))} style={inputStyle}>
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                        <option value={3}>Critical</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Ad Lead Days</FieldLabel>
                      <input type="number" value={form.adLeadDays} onChange={e => setForm(f => ({...f, adLeadDays: parseInt(e.target.value) || 0}))} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Actions</FieldLabel>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(ACTION_TYPES).map(([k, v]) => (
                        <button key={k} onClick={() => toggleFormAction(k)} style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                          border: `1px solid ${form.actions.includes(k) ? v.color : "#e5e5e0"}`,
                          background: form.actions.includes(k) ? `${v.color}20` : "#ffffff",
                          color: form.actions.includes(k) ? v.color : "#9ca3af",
                        }}>{v.icon} {v.label}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Post on Pages</FieldLabel>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {PAGES.map(pg => (
                        <button key={pg.id} onClick={() => toggleFormPage(pg.id)} style={{
                          padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                          border: `1px solid ${form.pages.includes(pg.id) ? pg.color : "#e5e5e0"}`,
                          background: form.pages.includes(pg.id) ? `${pg.color}18` : "#ffffff",
                          color: form.pages.includes(pg.id) ? pg.color : "#9ca3af",
                        }}>{pg.name.replace("Ambria ", "")}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <FieldLabel>Notes / Action Plan</FieldLabel>
                    <textarea value={form.note} onChange={e => setForm(f => ({...f, note: e.target.value}))} placeholder="What should the team do for this event..." rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={handleSave} style={{
                      padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
                      ...(mob ? { flex: 1 } : {}),
                    }}>Save Changes</button>
                    <button onClick={() => setEditMode(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e5e0", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer", ...(mob ? { flex: 1 } : {}) }}>Cancel</button>
                    {!evt.custom && evt.edited && (
                      <button onClick={handleReset} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(66,165,245,0.3)", background: "rgba(66,165,245,0.1)", color: "#42A5F5", fontSize: 12, fontWeight: 600, cursor: "pointer", ...(mob ? { width: "100%" } : {}) }}>↺ Reset to Default</button>
                    )}
                    {canDelete && <button onClick={handleDelete} style={{ ...(mob ? { width: "100%" } : { marginLeft: "auto" }), padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(239,83,80,0.3)", background: "rgba(239,83,80,0.1)", color: "#EF5350", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {evt.custom ? "Delete" : "Hide Event"}
                    </button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
