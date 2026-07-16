import { useState, useMemo } from "react";
import { PAGES, ACTION_TYPES, MONTHS_SHORT, MONTHS_FULL, WORKFLOW_STATUS } from "../lib/constants.js";
import { formatDate } from "../lib/helpers.js";
import useIsMobile from "../hooks/useIsMobile.js";

// FY runs April → March. Months are indexed 0=Jan..11=Dec.
const FY_MONTHS = [
  { y: 2026, m: 3 }, { y: 2026, m: 4 }, { y: 2026, m: 5 },
  { y: 2026, m: 6 }, { y: 2026, m: 7 }, { y: 2026, m: 8 },
  { y: 2026, m: 9 }, { y: 2026, m: 10 }, { y: 2026, m: 11 },
  { y: 2027, m: 0 }, { y: 2027, m: 1 }, { y: 2027, m: 2 },
];

const COMPLETED_STATUSES = ["posted", "ad_live", "completed", "done"];

const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const monthKeyOf = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function WorkflowHistory({ data, allEvents }) {
  const mob = useIsMobile();

  const today = new Date();
  const defaultKey = (() => {
    const fyMatch = FY_MONTHS.find(({ y, m }) => y === today.getFullYear() && m === today.getMonth());
    return fyMatch ? monthKey(fyMatch.y, fyMatch.m) : monthKey(FY_MONTHS[0].y, FY_MONTHS[0].m);
  })();

  const [selectedMonths, setSelectedMonths] = useState(new Set([defaultKey]));
  const [detailEvent, setDetailEvent] = useState(null);

  const toggleMonth = (key) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const fyLabel = `FY ${FY_MONTHS[0].y}-${String(FY_MONTHS[FY_MONTHS.length - 1].y).slice(-2)}`;
  const allYearActive = FY_MONTHS.every(({ y, m }) => selectedMonths.has(monthKey(y, m)));
  const toggleYear = () => {
    setSelectedMonths(allYearActive ? new Set() : new Set(FY_MONTHS.map(({ y, m }) => monthKey(y, m))));
  };

  // Resolve every completed workflow_status row → event metadata.
  const completedItems = useMemo(() => {
    const adRequestsById = new Map((data.adRequests || []).map(r => [r.id, r]));
    const eventsByKey = new Map(allEvents.map(e => [`${e.date}-${e.name}`, e]));
    const items = [];

    Object.entries(data.workflow || {}).forEach(([eventKey, pages]) => {
      Object.entries(pages || {}).forEach(([pageId, info]) => {
        if (!COMPLETED_STATUSES.includes(info?.status)) return;

        let evt;
        if (eventKey.startsWith("ad-")) {
          const req = adRequestsById.get(eventKey.substring(3));
          if (!req) return;
          const d = req.startDate || req.endDate;
          if (!d) return;
          evt = {
            key: eventKey,
            name: req.eventName,
            date: d,
            actions: ["ad"],
            isAdRequest: true,
            allPages: req.pages || [],
            priority: 2,
            cat: null,
            note: req.brief || "",
          };
        } else {
          const e = eventsByKey.get(eventKey);
          if (!e) return;
          evt = {
            key: eventKey,
            name: e.name,
            date: e.date,
            actions: e.actions || [],
            isAdRequest: false,
            allPages: e.pages || [],
            priority: e.priority || 0,
            cat: e.cat || "",
            note: e.note || "",
          };
        }
        items.push({
          eventKey,
          pageId,
          status: info.status,
          budget: parseFloat(info.budget) || 0,
          monthKey: monthKeyOf(evt.date),
          event: evt,
        });
      });
    });
    return items;
  }, [data.workflow, data.adRequests, allEvents]);

  const filteredItems = useMemo(() => {
    if (selectedMonths.size === 0) return [];
    return completedItems.filter(it => selectedMonths.has(it.monthKey));
  }, [completedItems, selectedMonths]);

  // Stats
  const stats = useMemo(() => {
    let stories = 0, ads = 0, budget = 0;
    filteredItems.forEach(it => {
      const actions = it.event.actions || [];
      if (actions.includes("ad")) ads++;
      else if (actions.includes("story")) stories++;
      budget += it.budget;
    });
    return { total: filteredItems.length, stories, ads, budget };
  }, [filteredItems]);

  // Per-page tally
  const perPage = useMemo(() => {
    const counts = new Map();
    filteredItems.forEach(it => {
      counts.set(it.pageId, (counts.get(it.pageId) || 0) + 1);
    });
    return PAGES
      .map(p => ({ ...p, count: counts.get(p.id) || 0 }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredItems]);

  const maxPerPage = perPage[0]?.count || 1;

  // Group by month → event → done pages
  const groupedByMonth = useMemo(() => {
    // event_key → { eventInfo, donePageIds:Set, budget }
    const eventsMap = new Map();
    filteredItems.forEach(it => {
      const cur = eventsMap.get(it.eventKey) || {
        event: it.event,
        donePages: new Set(),
        budget: 0,
      };
      cur.donePages.add(it.pageId);
      cur.budget += it.budget;
      eventsMap.set(it.eventKey, cur);
    });

    // group by month
    const byMonth = new Map();
    eventsMap.forEach((v, k) => {
      const mk = monthKeyOf(v.event.date);
      if (!byMonth.has(mk)) byMonth.set(mk, []);
      byMonth.get(mk).push({ key: k, ...v });
    });

    // sort months chronologically (FY order), and events by date
    const sortedMonths = [...byMonth.keys()].sort();
    return sortedMonths.map(mk => ({
      monthKey: mk,
      events: byMonth.get(mk).sort((a, b) => a.event.date.localeCompare(b.event.date)),
    }));
  }, [filteredItems]);

  const formatINR = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  const labelFor = (mk) => {
    const [y, m] = mk.split("-");
    return `${MONTHS_FULL[parseInt(m, 10) - 1]} ${y}`;
  };

  return (
    <div>
      <style>{`
        .hist-toggle-row {
          display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: nowrap;
          overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
          padding-bottom: 4px;
        }
        .hist-toggle-row::-webkit-scrollbar { display: none; }
        .hist-month-pill {
          padding: 7px 14px; border-radius: 20px; border: 1px solid #e5e5e0;
          background: #ffffff; color: #6b7280; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .hist-month-pill.active {
          background: #1a1a1a; color: #ffffff; border-color: #1a1a1a;
        }
        .hist-stats-grid {
          display: grid; gap: ${mob ? "10px" : "14px"}; margin-bottom: 20px;
          grid-template-columns: ${mob ? "1fr 1fr" : "repeat(4, 1fr)"};
        }
        .hist-stat-card {
          background: #ffffff; border: 1px solid #eeeee9; border-radius: 12px;
          padding: ${mob ? "14px 12px" : "18px 16px"}; box-shadow: 0 1px 6px rgba(0,0,0,0.04);
          text-align: center;
        }
        .hist-stat-num {
          font-family: 'Sora', sans-serif; font-size: ${mob ? "20px" : "26px"};
          font-weight: 800; line-height: 1.1; margin-bottom: 4px;
        }
        .hist-stat-label {
          font-size: ${mob ? "10px" : "11px"}; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.7px; font-weight: 600;
        }
        .hist-section {
          background: #ffffff; border: 1px solid #eeeee9; border-radius: 14px;
          padding: ${mob ? "14px" : "18px 20px"}; margin-bottom: 16px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .hist-section-title {
          font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
          color: #1a1a1a; margin-bottom: 14px;
        }
        .hist-bar-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
        }
        .hist-bar-label {
          width: ${mob ? "90px" : "130px"}; font-size: ${mob ? "11px" : "12px"};
          color: #374151; font-weight: 600; flex-shrink: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hist-bar-track {
          flex: 1; height: 18px; background: #f5f4f1; border-radius: 4px;
          overflow: hidden; position: relative;
        }
        .hist-bar-fill {
          height: 100%; border-radius: 4px; transition: width 0.4s ease;
        }
        .hist-bar-count {
          width: 30px; text-align: right; font-size: 12px; font-weight: 700;
          color: #1a1a1a; font-family: 'Sora', sans-serif;
        }
        .hist-month-header {
          display: flex; align-items: center; gap: 10px;
          margin: 22px 0 12px; padding-bottom: 6px;
          border-bottom: 1px solid #eeeee9;
        }
        .hist-month-header .label {
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
          color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.6px;
        }
        .hist-month-header .count {
          font-size: 11px; color: #9ca3af; font-weight: 600;
        }
        .hist-event-card {
          background: #ffffff; border: 1px solid #eeeee9; border-radius: 10px;
          padding: ${mob ? "10px 12px" : "12px 14px"}; margin-bottom: 8px;
          border-left: 3px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .hist-event-name {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 4px; flex-wrap: wrap;
        }
        .hist-event-name .title {
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
          color: #1a1a1a; line-height: 1.3;
        }
        .hist-event-name .date {
          font-size: 11px; color: #9ca3af; font-weight: 600; white-space: nowrap;
        }
        .hist-page-list {
          display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
        }
        .hist-page-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;
        }
        .hist-actions-row {
          display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
        }
        .hist-actions-row span {
          font-size: 9.5px; font-weight: 600; padding: 1px 7px; border-radius: 4px;
        }
        .hist-budget {
          font-size: 11px; color: #92400e; font-weight: 700; margin-top: 6px;
          display: inline-block; padding: 2px 8px; border-radius: 5px;
          background: rgba(255,179,0,0.1);
        }
        .hist-empty {
          text-align: center; padding: 40px 20px; color: #9ca3af;
          font-size: 14px; background: #ffffff; border: 1px dashed #eeeee9;
          border-radius: 12px;
        }
        .hist-detail-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.25); backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: center; justify-content: center;
        }
        .hist-detail-modal {
          background: #ffffff; border: 1px solid #e5e5e0; border-radius: 20px;
          width: ${mob ? "95vw" : "520px"}; max-width: 95vw; max-height: ${mob ? "85vh" : "90vh"}; overflow-y: auto;
          padding: ${mob ? "20px" : "26px"}; box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }
        .hist-detail-page-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; border-radius: 8px; background: #f8f8f6; margin-bottom: 6px;
        }
      `}</style>

      {/* Month selector */}
      <div className="hist-toggle-row">
        <button
          className={`hist-month-pill ${allYearActive ? "active" : ""}`}
          style={{ fontWeight: 800 }}
          onClick={toggleYear}
        >
          {fyLabel} {allYearActive ? "✓" : ""}
        </button>
        {FY_MONTHS.map(({ y, m }) => {
          const key = monthKey(y, m);
          const active = selectedMonths.has(key);
          return (
            <button
              key={key}
              className={`hist-month-pill ${active ? "active" : ""}`}
              onClick={() => toggleMonth(key)}
            >
              {MONTHS_SHORT[m]} {active ? "✓" : ""}
            </button>
          );
        })}
      </div>

      {selectedMonths.size === 0 ? (
        <div className="hist-empty">Select a month to view report</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="hist-stats-grid">
            <div className="hist-stat-card">
              <div className="hist-stat-num" style={{ color: "#43A047" }}>{stats.total}</div>
              <div className="hist-stat-label">Tasks Done</div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-num" style={{ color: "#43A047" }}>{stats.stories}</div>
              <div className="hist-stat-label">Stories</div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-num" style={{ color: "#E65100" }}>{stats.ads}</div>
              <div className="hist-stat-label">Ads</div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-num" style={{ color: "#92750a", fontSize: mob ? 16 : 22 }}>
                {formatINR(stats.budget)}
              </div>
              <div className="hist-stat-label">Budget Spent</div>
            </div>
          </div>

          {/* Per-page breakdown */}
          <div className="hist-section">
            <div className="hist-section-title">Tasks per Page</div>
            {perPage.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 12, padding: "12px 0" }}>
                No completed tasks in the selected months.
              </div>
            ) : (
              perPage.map(p => (
                <div key={p.id} className="hist-bar-row">
                  <div className="hist-bar-label" title={p.name}>
                    {p.name.replace("Ambria ", "")}
                  </div>
                  <div className="hist-bar-track">
                    <div
                      className="hist-bar-fill"
                      style={{ width: `${(p.count / maxPerPage) * 100}%`, background: p.color }}
                    />
                  </div>
                  <div className="hist-bar-count">{p.count}</div>
                </div>
              ))
            )}
          </div>

          {/* Event-wise detail list */}
          <div className="hist-section">
            <div className="hist-section-title">Event-wise Detail</div>
            {groupedByMonth.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 12, padding: "12px 0" }}>
                No completed events in the selected months.
              </div>
            ) : (
              groupedByMonth.map(({ monthKey: mk, events }) => {
                const totalTasksInMonth = events.reduce((sum, e) => sum + e.donePages.size, 0);
                return (
                  <div key={mk}>
                    <div className="hist-month-header">
                      <span className="label">── {labelFor(mk)}</span>
                      <span className="count">({totalTasksInMonth} task{totalTasksInMonth === 1 ? "" : "s"})</span>
                    </div>
                    {events.map(ev => {
                      const allPages = ev.event.allPages || [];
                      const priorityColor =
                        ev.event.priority === 3 ? "#EF5350" :
                        ev.event.priority === 2 ? "#FFB300" :
                        ev.event.priority === 1 ? "#66BB6A" : "#d1d5db";
                      return (
                        <div
                          key={ev.key}
                          className="hist-event-card"
                          style={{ borderLeftColor: priorityColor, cursor: "pointer" }}
                          onClick={() => setDetailEvent(ev)}
                        >
                          <div className="hist-event-name">
                            <span className="title">✅ {ev.event.name}</span>
                            <span className="date">{formatDate(ev.event.date)}</span>
                          </div>
                          <div className="hist-page-list">
                            {allPages.map(pid => {
                              const pg = PAGES.find(p => p.id === pid);
                              if (!pg) return null;
                              const isDone = ev.donePages.has(pid);
                              return (
                                <span
                                  key={pid}
                                  className="hist-page-tag"
                                  style={{
                                    background: isDone ? `${pg.color}18` : "#f5f4f1",
                                    color: isDone ? pg.color : "#9ca3af",
                                  }}
                                >
                                  <span style={{
                                    width: 5, height: 5, borderRadius: "50%",
                                    background: isDone ? pg.color : "#d1d5db",
                                    display: "inline-block",
                                  }} />
                                  {pg.name.replace("Ambria ", "")} {isDone ? "✓" : "⏳"}
                                </span>
                              );
                            })}
                          </div>
                          {(ev.event.actions || []).length > 0 && (
                            <div className="hist-actions-row">
                              {ev.event.actions.map(a => {
                                const at = ACTION_TYPES[a];
                                if (!at) return null;
                                return <span key={a} style={{ background: at.bg, color: at.color }}>{at.icon} {at.label}</span>;
                              })}
                            </div>
                          )}
                          {ev.budget > 0 && (
                            <div className="hist-budget">💰 Budget: {formatINR(ev.budget)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {detailEvent && (() => {
        const ev = detailEvent;
        const pageStatuses = data.workflow?.[ev.key] || {};
        const priorityLabels = ["Low", "Medium", "High", "Critical"];
        return (
          <div className="hist-detail-overlay" onClick={() => setDetailEvent(null)}>
            <div className="hist-detail-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Sora'", fontSize: mob ? 17 : 19, fontWeight: 700, color: "#1a1a1a" }}>
                    ✅ {ev.event.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{formatDate(ev.event.date)}</div>
                </div>
                <button onClick={() => setDetailEvent(null)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "#f3f2ef", color: "#6b7280" }}>
                  {priorityLabels[ev.event.priority] || "Low"} Priority
                </span>
                {ev.event.cat && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, background: "#f3f2ef", color: "#6b7280" }}>
                    {ev.event.cat}
                  </span>
                )}
                {ev.event.isAdRequest && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 6, background: "rgba(230,81,0,0.1)", color: "#E65100" }}>
                    Ad Request
                  </span>
                )}
              </div>

              {ev.event.note && (
                <div style={{ background: "#f8f8f6", border: "1px solid #eeeee9", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  {ev.event.note}
                </div>
              )}

              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Per-Page Status
              </div>
              {(ev.event.allPages || []).map(pid => {
                const pg = PAGES.find(p => p.id === pid);
                if (!pg) return null;
                const info = pageStatuses[pid];
                const statusInfo = WORKFLOW_STATUS[info?.status] || WORKFLOW_STATUS.pending;
                const budget = parseFloat(info?.budget) || 0;
                return (
                  <div key={pid} className="hist-detail-page-row">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{pg.name.replace("Ambria ", "")}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {budget > 0 && <span style={{ fontSize: 11, color: "#92400e" }}>{formatINR(budget)}</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {ev.budget > 0 && (
                <div className="hist-budget" style={{ marginTop: 8 }}>💰 Total Budget: {formatINR(ev.budget)}</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
