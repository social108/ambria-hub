import { useState, useMemo } from "react";
import { PAGES, ACTION_TYPES, MONTHS_FULL, CAT_OPTIONS, EMPTY_FORM } from "../lib/constants.js";
import { EVENTS } from "../lib/events.js";
import { daysUntil, formatDate } from "../lib/helpers.js";
import FieldLabel from "./shared/FieldLabel.jsx";
import MiniChip from "./shared/MiniChip.jsx";

const navBtnStyle = { background: "#f3f2ef", border: "1px solid #e5e5e0", borderRadius: 8, padding: "5px 14px", color: "#6b7280", fontSize: 18, cursor: "pointer", fontWeight: 600 };
const inputStyle = { width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13 };

export default function CalendarView({ allEvents, data, updateWorkflow, addEvent, updateEvent, deleteEvent, resetBuiltin, restoreBuiltin, hiddenCount, hiddenBuiltins }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null); // null | { mode: "add"|"edit", event?: obj } | { mode: "restore" }
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [actionFilter, setActionFilter] = useState("All");

  // Calendar math
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  // Build grid: 6 rows × 7 cols
  const grid = useMemo(() => {
    const cells = [];
    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, month: m, year: y, outside: true });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, outside: false });
    }
    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, month: m, year: y, outside: true });
    }
    return cells;
  }, [viewMonth, viewYear, firstDay, daysInMonth, prevMonthDays]);

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach(e => {
      if (actionFilter !== "All" && !e.actions.includes(actionFilter)) return;
      const key = e.date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [allEvents, actionFilter]);

  const cellDateStr = (cell) => {
    const mm = String(cell.month + 1).padStart(2, "0");
    const dd = String(cell.day).padStart(2, "0");
    return `${cell.year}-${mm}-${dd}`;
  };

  const isToday = (cell) => {
    return cell.day === today.getDate() && cell.month === today.getMonth() && cell.year === today.getFullYear();
  };

  const navigateMonth = (dir) => {
    let m = viewMonth + dir, y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  };

  const goToToday = () => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); };

  const openAdd = (dateStr) => {
    setForm({ ...EMPTY_FORM, date: dateStr || "" });
    setModal({ mode: "add" });
  };

  const openEdit = (evt) => {
    setForm({
      name: evt.name, date: evt.date, cat: evt.cat || "Custom",
      actions: [...(evt.actions || [])], pages: [...(evt.pages || [])],
      priority: evt.priority ?? 2, adLeadDays: evt.adLeadDays || 15, note: evt.note || "",
    });
    setModal({ mode: "edit", event: evt });
  };

  const openView = (dateStr) => {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleSave = () => {
    if (!form.name || !form.date) return;
    if (modal.mode === "add") {
      addEvent(form);
    } else if (modal.mode === "edit") {
      const isBuiltin = !modal.event?.custom;
      updateEvent(modal.event.id, form, isBuiltin);
    }
    setModal(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleDelete = (evt) => {
    const label = evt.custom ? "Delete" : "Hide";
    if (confirm(`${label} "${evt.name}"?${!evt.custom ? " You can restore it later from the Restore panel." : ""}`)) {
      deleteEvent(evt.id, !evt.custom);
      setModal(null);
      setSelectedDate(null);
    }
  };

  const handleReset = (evt) => {
    if (!evt.custom && confirm(`Reset "${evt.name}" to its original defaults? Your edits will be lost.`)) {
      resetBuiltin(evt.id);
      setModal(null);
    }
  };

  const toggleFormAction = (a) => setForm(f => ({ ...f, actions: f.actions.includes(a) ? f.actions.filter(x => x !== a) : [...f.actions, a] }));
  const toggleFormPage = (p) => setForm(f => ({ ...f, pages: f.pages.includes(p) ? f.pages.filter(x => x !== p) : [...f.pages, p] }));

  // Stats
  const monthEvents = allEvents.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear && (actionFilter === "All" || e.actions.includes(actionFilter));
  });

  return (
    <div>
      <style>{`
        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #eeeee9; border-radius: 12px; overflow: hidden; border: 1px solid #eeeee9; }
        .cal-header-cell { padding: 10px 4px; text-align: center; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; background: #f8f8f6; }
        .cal-cell {
          min-height: 100px; padding: 6px; background: #ffffff; position: relative;
          cursor: pointer; transition: background 0.15s; vertical-align: top;
        }
        .cal-cell:hover { background: #f8f8f6; }
        .cal-cell.outside { opacity: 0.35; }
        .cal-cell.today { background: rgba(180,140,50,0.06); }
        .cal-cell.selected { background: rgba(26,26,26,0.04); box-shadow: inset 0 0 0 1px rgba(26,26,26,0.15); }
        .cal-day-num {
          font-family: 'Sora'; font-size: 13px; font-weight: 600; color: #6b7280;
          width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
          border-radius: 50%; margin-bottom: 3px;
        }
        .cal-day-num.today-num { background: #1a1a1a; color: #fff; font-weight: 800; }
        .cal-evt-dot {
          display: flex; align-items: center; gap: 3px; padding: 2px 5px; border-radius: 4px;
          font-size: 9.5px; font-weight: 600; margin-bottom: 2px; cursor: pointer;
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis; transition: all 0.15s;
          max-width: 100%;
        }
        .cal-evt-dot:hover { filter: brightness(1.3); transform: scale(1.02); }
        .cal-add-btn {
          position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
          border-radius: 50%; border: none; background: #f3f2ef;
          color: #9ca3af; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s;
        }
        .cal-cell:hover .cal-add-btn { opacity: 1; }
        .cal-add-btn:hover { background: rgba(26,26,26,0.08); color: #1a1a1a; }
        .cal-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center;
          animation: calFadeIn 0.2s ease;
        }
        .cal-modal {
          background: #ffffff; border: 1px solid #e5e5e0; border-radius: 20px;
          width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; padding: 28px;
          animation: calSlideUp 0.25s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }
        @keyframes calFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes calSlideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .cal-sidebar {
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 12px; padding: 16px; margin-top: 16px; animation: calFadeIn 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .cal-sidebar-event {
          padding: 10px 12px; border-radius: 10px; margin-bottom: 6px;
          background: #ffffff; border: 1px solid #eeeee9;
          transition: all 0.15s; cursor: pointer;
        }
        .cal-sidebar-event:hover { background: #f8f8f6; border-color: #e5e5e0; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>
            Events Calendar
          </h1>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>{monthEvents.length} events in {MONTHS_FULL[viewMonth]} · Click a date to view · Hover + to add</p>
        </div>
        <button onClick={() => openAdd("")} style={{
          padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
        }}>+ Add Event</button>
      </div>

      {/* Month nav + filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => navigateMonth(-1)} style={navBtnStyle}>‹</button>
        <div style={{ fontFamily: "'Sora', serif", fontSize: 22, fontWeight: 700, color: "#1a1a1a", minWidth: 200, textAlign: "center" }}>
          {MONTHS_FULL[viewMonth]} {viewYear}
        </div>
        <button onClick={() => navigateMonth(1)} style={navBtnStyle}>›</button>
        <button onClick={goToToday} style={{ ...navBtnStyle, fontSize: 11, padding: "5px 14px", borderRadius: 8, marginLeft: 4 }}>Today</button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          <MiniChip active={actionFilter === "All"} onClick={() => setActionFilter("All")}>All</MiniChip>
          {Object.entries(ACTION_TYPES).map(([k, v]) => (
            <MiniChip key={k} active={actionFilter === k} onClick={() => setActionFilter(k)} color={v.color}>{v.icon} {v.label}</MiniChip>
          ))}
        </div>
      </div>

      {/* CALENDAR GRID */}
      <div className="cal-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="cal-header-cell">{d}</div>
        ))}
        {grid.map((cell, i) => {
          const dateStr = cellDateStr(cell);
          const evts = eventsByDate[dateStr] || [];
          const isSel = selectedDate === dateStr;
          const todayCell = isToday(cell);
          return (
            <div
              key={i}
              className={`cal-cell ${cell.outside ? "outside" : ""} ${todayCell ? "today" : ""} ${isSel ? "selected" : ""}`}
              onClick={() => !cell.outside && openView(dateStr)}
            >
              <div className={`cal-day-num ${todayCell ? "today-num" : ""}`}>{cell.day}</div>
              {!cell.outside && (
                <button className="cal-add-btn" onClick={(ev) => { ev.stopPropagation(); openAdd(dateStr); }}>+</button>
              )}
              {evts.slice(0, 3).map((evt, ei) => {
                const priorityColors = ["#78909C","#FFB300","#F4511E","#D50000"];
                const pColor = priorityColors[evt.priority] || "#78909C";
                return (
                  <div
                    key={ei}
                    className="cal-evt-dot"
                    style={{ background: `${pColor}20`, color: pColor }}
                    onClick={(ev) => { ev.stopPropagation(); openEdit(evt); }}
                    title={evt.name}
                  >
                    {evt.actions?.includes("ad") && <span style={{ fontSize: 8 }}>▲</span>}
                    {evt.actions?.includes("host") && <span style={{ fontSize: 8 }}>★</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{evt.name}</span>
                    {evt.custom && <span style={{ fontSize: 7, opacity: 0.6, marginLeft: "auto" }}>✎</span>}
                  </div>
                );
              })}
              {evts.length > 3 && (
                <div style={{ fontSize: 9, color: "#d1d5db", padding: "1px 5px" }}>+{evts.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date sidebar */}
      {selectedDate && (eventsByDate[selectedDate]?.length > 0) && (
        <div className="cal-sidebar">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Sora'", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
              {formatDate(selectedDate)} — {eventsByDate[selectedDate].length} event{eventsByDate[selectedDate].length > 1 ? "s" : ""}
            </div>
            <button onClick={() => openAdd(selectedDate)} style={{ background: "rgba(26,26,26,0.06)", border: "1px solid #e5e5e0", borderRadius: 8, padding: "4px 12px", color: "#1a1a1a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+ Add</button>
          </div>
          {eventsByDate[selectedDate].map((evt, i) => {
            const priorityColors = ["#78909C","#FFB300","#F4511E","#D50000"];
            return (
              <div key={i} className="cal-sidebar-event" onClick={() => openEdit(evt)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: priorityColors[evt.priority] || "#78909C" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Sora'", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                      {evt.name}
                      {evt.custom && <span style={{ fontSize: 9, background: "rgba(201,168,76,0.15)", color: "#C9A84C", padding: "1px 6px", borderRadius: 4 }}>Custom</span>}
                      {!evt.custom && evt.edited && <span style={{ fontSize: 9, background: "rgba(66,165,245,0.15)", color: "#42A5F5", padding: "1px 6px", borderRadius: 4 }}>Edited</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{evt.cat}</div>
                  </div>
                  <button onClick={(ev) => { ev.stopPropagation(); handleDelete(evt); }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 6, padding: "3px 8px", color: "#EF5350", fontSize: 10, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: evt.note ? 6 : 0 }}>
                  {(evt.actions || []).map(a => {
                    const at = ACTION_TYPES[a];
                    return at ? <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontWeight: 600, background: at.bg, color: at.color }}>{at.icon} {at.label}</span> : null;
                  })}
                </div>
                {evt.note && <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, marginTop: 4 }}>💡 {evt.note}</div>}
                {(evt.pages || []).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {evt.pages.map(pid => {
                      const pg = PAGES.find(p => p.id === pid);
                      return pg ? <span key={pid} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: `${pg.color}15`, color: pg.color, fontWeight: 600 }}>{pg.name.replace("Ambria ", "")}</span> : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Restore hidden events panel */}
      {hiddenCount > 0 && (
        <div style={{ marginTop: 16, background: "rgba(239,83,80,0.04)", border: "1px solid rgba(239,83,80,0.12)", borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hiddenCount > 0 ? 8 : 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>🗑 {hiddenCount} hidden event{hiddenCount > 1 ? "s" : ""}</span>
            <button onClick={() => setModal({ mode: "restore" })} style={{ background: "#f3f2ef", border: "1px solid #e5e5e0", borderRadius: 8, padding: "4px 12px", color: "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Restore Events</button>
          </div>
        </div>
      )}

      {/* MODAL — Add / Edit / Restore */}
      {modal && (
        <div className="cal-modal-overlay" onClick={() => setModal(null)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>

            {/* RESTORE MODAL */}
            {modal.mode === "restore" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Sora'", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Restore Hidden Events</div>
                  <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                {hiddenBuiltins.map(hid => {
                  const original = EVENTS.find(e => `builtin-${e.date}-${e.name}` === hid);
                  if (!original) return null;
                  return (
                    <div key={hid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{original.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(original.date)} · {original.cat}</div>
                      </div>
                      <button onClick={() => { restoreBuiltin(hid); if (hiddenBuiltins.length <= 1) setModal(null); }} style={{ background: "rgba(102,187,106,0.15)", border: "1px solid rgba(102,187,106,0.3)", borderRadius: 8, padding: "6px 14px", color: "#66BB6A", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Restore</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ADD / EDIT MODAL */
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontFamily: "'Sora'", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>
                      {modal.mode === "add" ? "Add New Event" : "Edit Event"}
                    </div>
                    {modal.mode === "edit" && !modal.event?.custom && (
                      <span style={{ fontSize: 10, background: "rgba(66,165,245,0.12)", color: "#42A5F5", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Built-in</span>
                    )}
                    {modal.mode === "edit" && modal.event?.custom && (
                      <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#C9A84C", padding: "3px 10px", borderRadius: 6, fontWeight: 600 }}>Custom</span>
                    )}
                  </div>
                  <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
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
                  }}>{modal.mode === "add" ? "Add Event" : "Save Changes"}</button>
                  <button onClick={() => setModal(null)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e5e0", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  {modal.mode === "edit" && !modal.event?.custom && modal.event?.edited && (
                    <button onClick={() => handleReset(modal.event)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(66,165,245,0.3)", background: "rgba(66,165,245,0.1)", color: "#42A5F5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↺ Reset to Default</button>
                  )}
                  {modal.mode === "edit" && (
                    <button onClick={() => handleDelete(modal.event)} style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(239,83,80,0.3)", background: "rgba(239,83,80,0.1)", color: "#EF5350", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {modal.event?.custom ? "Delete" : "Hide Event"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
