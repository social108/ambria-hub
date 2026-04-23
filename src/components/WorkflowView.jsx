import { useState, useMemo } from "react";
import { PAGES, ACTION_TYPES, KANBAN_COLUMNS } from "../lib/constants.js";
import { daysUntil, formatDate, getCreativeDeadline, getAdStartDate } from "../lib/helpers.js";
import Chip from "./shared/Chip.jsx";
import useIsMobile from "../hooks/useIsMobile.js";

export default function WorkflowView({ data, updateWorkflow, allEvents }) {
  const [filter, setFilter] = useState("upcoming");
  const [pageFilter, setPageFilter] = useState("All");
  const [dragItem, setDragItem] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const mob = useIsMobile();

  const tasks = useMemo(() => {
    const list = [];
    allEvents.forEach(e => {
      const d = daysUntil(e.date);
      const passFilter = filter === "all" ? true
        : filter === "upcoming" ? (d >= -3 && d <= 45)
        : filter === "thisweek" ? (d >= -1 && d <= 7)
        : filter === "overdue" ? (() => {
            return d < 0 && e.pages.some(pid => {
              const st = data.workflow[`${e.date}-${e.name}`]?.[pid]?.status;
              return !st || st === "pending" || st === "creative_wip";
            });
          })()
        : true;
      if (!passFilter) return;

      const pages = pageFilter === "All" ? e.pages : e.pages.filter(p => p === pageFilter);
      pages.forEach(pid => {
        const key = `${e.date}-${e.name}`;
        const st = data.workflow[key]?.[pid]?.status || "pending";
        const pg = PAGES.find(p => p.id === pid);
        list.push({ eventKey: key, event: e, pageId: pid, page: pg, status: st, days: d });
      });
    });
    return list;
  }, [data.workflow, filter, pageFilter, allEvents]);

  const columns = useMemo(() => {
    const cols = {};
    KANBAN_COLUMNS.forEach(c => { cols[c.id] = []; });
    tasks.forEach(t => {
      if (cols[t.status]) cols[t.status].push(t);
      else cols.pending.push(t);
    });
    Object.values(cols).forEach(arr => arr.sort((a, b) => a.days - b.days));
    return cols;
  }, [tasks]);

  const handleDragStart = (task) => {
    setDragItem(task);
  };

  const handleDrop = (colId) => {
    if (dragItem && dragItem.status !== colId) {
      updateWorkflow(dragItem.eventKey, dragItem.pageId, "status", colId);
    }
    setDragItem(null);
    setDragOverCol(null);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "posted" || t.status === "completed" || t.status === "ad_live").length;
  const overdueTasks = tasks.filter(t => t.days < 0 && (t.status === "pending" || t.status === "creative_wip")).length;

  return (
    <div>
      <style>{`
        .kanban-scroll {
          display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; min-height: ${mob ? "400px" : "500px"};
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .kanban-scroll::-webkit-scrollbar { display: none; }
        .kanban-col {
          min-width: ${mob ? "260px" : "220px"}; max-width: ${mob ? "280px" : "260px"}; flex: 1 0 ${mob ? "260px" : "220px"};
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .kanban-col.drag-over { border-color: rgba(26,26,26,0.3); background: rgba(26,26,26,0.02); }
        .kanban-col-header {
          padding: ${mob ? "10px 10px 8px" : "14px 14px 10px"}; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #eeeee9; position: sticky; top: 0; z-index: 2;
          background: #ffffff;
        }
        .kanban-col-body { padding: ${mob ? "6px" : "8px"}; flex: 1; overflow-y: auto; max-height: 65vh; }
        .kanban-card {
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          padding: ${mob ? "8px 10px" : "10px 12px"}; margin-bottom: 6px;
          cursor: grab; transition: all 0.2s; position: relative;
        }
        .kanban-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .kanban-card.dragging { opacity: 0.4; transform: scale(0.95); }
        .kanban-card .card-event {
          font-family: 'Sora', sans-serif; font-size: 12.5px; font-weight: 600;
          color: #1a1a1a; line-height: 1.3; margin-bottom: 5px;
        }
        .kanban-card .card-page {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 500; padding: 2px 7px; border-radius: 5px;
          margin-bottom: 6px;
        }
        .kanban-card .card-date { font-size: 10px; color: #9ca3af; }
        .kanban-card .card-actions { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
        .kanban-card .card-actions span {
          font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
        }
        .card-urgency {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 10px 10px 0 0;
        }
        .card-expanded-note {
          margin-top: 8px; padding: 8px 10px; background: #f8f8f6;
          border-radius: 6px; border-left: 2px solid #d1d5db;
          font-size: 11px; color: #6b7280; line-height: 1.5;
          animation: kFadeIn 0.15s ease;
        }
        .card-move-btns { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; animation: kFadeIn 0.15s ease; }
        .card-move-btn {
          flex: ${mob ? "1 0 calc(50% - 4px)" : "1"}; padding: 5px 4px; border-radius: 6px; border: 1px solid #e5e5e0;
          background: #ffffff; color: #6b7280; font-size: 9.5px;
          font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s;
        }
        .card-move-btn:hover { background: #f3f2ef; color: #1a1a1a; }
        @keyframes kFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        .kanban-stats-bar {
          display: flex; gap: 8px; margin-bottom: 12px;
          ${mob ? "overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-wrap: nowrap;" : "flex-wrap: wrap;"}
        }
        .kanban-stats-bar::-webkit-scrollbar { display: none; }
        .kanban-stat {
          display: flex; align-items: center; gap: 8px;
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 10px; padding: ${mob ? "6px 10px" : "8px 14px"};
          flex-shrink: 0;
        }
        .kanban-stat .ks-num { font-family: 'Sora'; font-size: ${mob ? "16px" : "20px"}; font-weight: 700; }
        .kanban-stat .ks-label { font-size: ${mob ? "9px" : "10px"}; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .kanban-progress-bar {
          height: 4px; border-radius: 2px; background: #eeeee9;
          overflow: hidden; margin-bottom: 16px;
        }
        .kanban-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        .wf-filter-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 22 : 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
          Workflow Board
        </h1>
        <p style={{ fontSize: mob ? 11 : 13, color: "#9ca3af" }}>{mob ? "Tap cards to move · Swipe columns" : "Drag cards between columns or click to move · Each card = 1 event × 1 page"}</p>
      </div>

      {/* Stats */}
      <div className="kanban-stats-bar">
        <div className="kanban-stat">
          <span className="ks-num" style={{ color: "#C9A84C" }}>{totalTasks}</span>
          <span className="ks-label">Total Tasks</span>
        </div>
        <div className="kanban-stat">
          <span className="ks-num" style={{ color: "#66BB6A" }}>{doneTasks}</span>
          <span className="ks-label">Done</span>
        </div>
        {overdueTasks > 0 && (
          <div className="kanban-stat" style={{ borderColor: "rgba(239,83,80,0.2)" }}>
            <span className="ks-num" style={{ color: "#EF5350" }}>{overdueTasks}</span>
            <span className="ks-label">Overdue</span>
          </div>
        )}
        <div className="kanban-stat">
          <span className="ks-num" style={{ color: "#7E57C2" }}>{totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%</span>
          <span className="ks-label">Complete</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="kanban-progress-bar">
        <div className="kanban-progress-fill" style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%`, background: "linear-gradient(90deg, #66BB6A, #43A047)" }} />
      </div>

      {/* Filters */}
      <div className="wf-filter-row" style={{
        display: "flex", gap: 6, marginBottom: 8,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#d1d5db", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px", flexShrink: 0 }}>Show</span>
        {[
          { v: "thisweek", l: "This Week" }, { v: "upcoming", l: "Next 45 Days" },
          { v: "overdue", l: "⚠ Overdue" }, { v: "all", l: "All Year" },
        ].map(f => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)} style={{ flexShrink: 0 }}>{f.l}</Chip>)}
      </div>
      <div className="wf-filter-row" style={{
        display: "flex", gap: 6, marginBottom: 16,
        ...(mob ? { overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", flexWrap: "nowrap" } : { flexWrap: "wrap" }),
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#d1d5db", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px", flexShrink: 0 }}>Page</span>
        <Chip active={pageFilter === "All"} onClick={() => setPageFilter("All")} style={{ flexShrink: 0 }}>All Pages</Chip>
        {PAGES.map(p => (
          <Chip key={p.id} active={pageFilter === p.id} onClick={() => setPageFilter(p.id)} style={{ flexShrink: 0 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: p.color, marginRight: 4, verticalAlign: "middle" }} />
            {p.name.replace("Ambria ", "").replace("Ambria.in","Ambria.in")}
          </Chip>
        ))}
      </div>

      {/* KANBAN BOARD */}
      <div className="kanban-scroll">
        {KANBAN_COLUMNS.map(col => {
          const cards = columns[col.id] || [];
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`kanban-col ${isOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="kanban-col-header">
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 14, color: col.color, fontWeight: 700 }}>{col.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: "'Sora'" }}>{col.label}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: col.color,
                  background: col.accent, padding: "2px 8px", borderRadius: 6, minWidth: 22, textAlign: "center",
                }}>{cards.length}</span>
              </div>
              <div className="kanban-col-body">
                {cards.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "#d1d5db", fontSize: 12 }}>
                    Drop cards here
                  </div>
                )}
                {cards.map(task => {
                  const cardKey = `${task.eventKey}__${task.pageId}`;
                  const isExpanded = expandedCard === cardKey;
                  const isDragging = dragItem && dragItem.eventKey === task.eventKey && dragItem.pageId === task.pageId;
                  const urgencyColor = task.days < 0 ? "#EF5350" : task.days <= 3 ? "#FF7043" : task.days <= 7 ? "#FFB300" : "transparent";

                  const colIndex = KANBAN_COLUMNS.findIndex(c => c.id === col.id);
                  const moveTargets = KANBAN_COLUMNS.filter((c, i) => i !== colIndex);

                  return (
                    <div
                      key={cardKey}
                      className={`kanban-card ${isDragging ? "dragging" : ""}`}
                      draggable={!mob}
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={() => { setDragItem(null); setDragOverCol(null); }}
                      onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
                    >
                      <div className="card-urgency" style={{ background: urgencyColor }} />
                      <div className="card-page" style={{ background: `${task.page.color}18`, color: task.page.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: task.page.color, display: "inline-block" }} />
                        {task.page.name.replace("Ambria ", "")}
                      </div>
                      <div className="card-event">{task.event.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="card-date">{formatDate(task.event.date)}</span>
                        {task.days >= 0 ? (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                            background: task.days <= 3 ? "rgba(239,83,80,0.15)" : task.days <= 7 ? "rgba(255,179,0,0.12)" : "#f5f4f1",
                            color: task.days <= 3 ? "#EF5350" : task.days <= 7 ? "#FFB300" : "#9ca3af",
                          }}>
                            {task.days === 0 ? "TODAY" : `${task.days}d`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(239,83,80,0.12)", color: "#EF5350" }}>
                            {Math.abs(task.days)}d ago
                          </span>
                        )}
                      </div>
                      <div className="card-actions">
                        {task.event.actions.map(a => {
                          const at = ACTION_TYPES[a];
                          return <span key={a} style={{ background: at.bg, color: at.color }}>{at.icon} {at.label}</span>;
                        })}
                      </div>
                      {task.event.actions.includes("ad") && task.event.adLeadDays && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, color: "#d1d5db", background: "#f5f4f1", padding: "2px 6px", borderRadius: 4 }}>
                            ✎ Creative by {formatDate(getCreativeDeadline(task.event.date, task.event.adLeadDays))}
                          </span>
                          <span style={{ fontSize: 9, color: "rgba(230,81,0,0.6)", background: "rgba(230,81,0,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                            ▲ Ads from {formatDate(getAdStartDate(task.event.date, task.event.adLeadDays))}
                          </span>
                        </div>
                      )}
                      {isExpanded && (
                        <>
                          <div className="card-expanded-note">
                            💡 {task.event.note}
                          </div>
                          <div className="card-move-btns">
                            {moveTargets.map(target => (
                              <button
                                key={target.id}
                                className="card-move-btn"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  updateWorkflow(task.eventKey, task.pageId, "status", target.id);
                                  setExpandedCard(null);
                                }}
                                style={{ borderColor: `${target.color}30`, color: target.color }}
                              >
                                {target.icon} {target.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
