import { useState, useMemo } from "react";
import { PAGES, ACTION_TYPES, KANBAN_COLUMNS } from "../lib/constants.js";
import { daysUntil, formatDate, getCreativeDeadline, getAdStartDate } from "../lib/helpers.js";
import Chip from "./shared/Chip.jsx";

export default function WorkflowView({ data, updateWorkflow, allEvents }) {
  const [filter, setFilter] = useState("upcoming");
  const [pageFilter, setPageFilter] = useState("All");
  const [dragItem, setDragItem] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  // Build flat task list: each task = one event × one page
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

  // Group tasks by status for kanban columns
  const columns = useMemo(() => {
    const cols = {};
    KANBAN_COLUMNS.forEach(c => { cols[c.id] = []; });
    tasks.forEach(t => {
      if (cols[t.status]) cols[t.status].push(t);
      else cols.pending.push(t);
    });
    // Sort each column: closest events first
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
        .kanban-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; min-height: 500px; }
        .kanban-col {
          min-width: 220px; max-width: 260px; flex: 1 0 220px;
          background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; display: flex; flex-direction: column; overflow: hidden;
        }
        .kanban-col.drag-over { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.03); }
        .kanban-col-header {
          padding: 14px 14px 10px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.04); position: sticky; top: 0; z-index: 2;
          background: rgba(12,12,18,0.9); backdrop-filter: blur(8px);
        }
        .kanban-col-body { padding: 8px; flex: 1; overflow-y: auto; max-height: 65vh; }
        .kanban-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px 12px; margin-bottom: 6px;
          cursor: grab; transition: all 0.2s; position: relative;
        }
        .kanban-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); transform: translateY(-1px); }
        .kanban-card.dragging { opacity: 0.4; transform: scale(0.95); }
        .kanban-card .card-event {
          font-family: 'Outfit', sans-serif; font-size: 12.5px; font-weight: 600;
          color: rgba(255,255,255,0.88); line-height: 1.3; margin-bottom: 5px;
        }
        .kanban-card .card-page {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 500; padding: 2px 7px; border-radius: 5px;
          margin-bottom: 6px;
        }
        .kanban-card .card-date { font-size: 10px; color: rgba(255,255,255,0.35); }
        .kanban-card .card-actions { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
        .kanban-card .card-actions span {
          font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
        }
        .card-urgency {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; border-radius: 10px 10px 0 0;
        }
        .card-expanded-note {
          margin-top: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03);
          border-radius: 6px; border-left: 2px solid rgba(201,168,76,0.4);
          font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1.5;
          animation: kFadeIn 0.15s ease;
        }
        .card-move-btns { display: flex; gap: 4px; margin-top: 8px; animation: kFadeIn 0.15s ease; }
        .card-move-btn {
          flex: 1; padding: 5px 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); font-size: 9.5px;
          font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s;
        }
        .card-move-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        @keyframes kFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        .kanban-stats-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .kanban-stat {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 8px 14px;
        }
        .kanban-stat .ks-num { font-family: 'Outfit'; font-size: 20px; font-weight: 700; }
        .kanban-stat .ks-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
        .kanban-progress-bar {
          height: 4px; border-radius: 2px; background: rgba(255,255,255,0.06);
          overflow: hidden; margin-bottom: 16px;
        }
        .kanban-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#fff 30%,#66BB6A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
          Workflow Board
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Drag cards between columns or click to move · Each card = 1 event × 1 page</p>
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
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px" }}>Show</span>
        {[
          { v: "thisweek", l: "This Week" }, { v: "upcoming", l: "Next 45 Days" },
          { v: "overdue", l: "⚠ Overdue" }, { v: "all", l: "All Year" },
        ].map(f => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)}>{f.l}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px" }}>Page</span>
        <Chip active={pageFilter === "All"} onClick={() => setPageFilter("All")}>All Pages</Chip>
        {PAGES.map(p => (
          <Chip key={p.id} active={pageFilter === p.id} onClick={() => setPageFilter(p.id)}>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", fontFamily: "'Outfit'" }}>{col.label}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: col.color,
                  background: col.accent, padding: "2px 8px", borderRadius: 6, minWidth: 22, textAlign: "center",
                }}>{cards.length}</span>
              </div>
              <div className="kanban-col-body">
                {cards.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
                    Drop cards here
                  </div>
                )}
                {cards.map(task => {
                  const cardKey = `${task.eventKey}__${task.pageId}`;
                  const isExpanded = expandedCard === cardKey;
                  const isDragging = dragItem && dragItem.eventKey === task.eventKey && dragItem.pageId === task.pageId;
                  const urgencyColor = task.days < 0 ? "#EF5350" : task.days <= 3 ? "#FF7043" : task.days <= 7 ? "#FFB300" : "transparent";
                  const priorityColors = ["transparent","rgba(255,179,0,0.3)","rgba(244,81,30,0.35)","rgba(213,0,0,0.4)"];

                  // Determine which columns this card can move to (adjacent + skip)
                  const colIndex = KANBAN_COLUMNS.findIndex(c => c.id === col.id);
                  const moveTargets = KANBAN_COLUMNS.filter((c, i) => i !== colIndex);

                  return (
                    <div
                      key={cardKey}
                      className={`kanban-card ${isDragging ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={() => { setDragItem(null); setDragOverCol(null); }}
                      onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
                    >
                      {/* Urgency stripe */}
                      <div className="card-urgency" style={{ background: urgencyColor }} />

                      {/* Page badge */}
                      <div className="card-page" style={{ background: `${task.page.color}18`, color: task.page.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: task.page.color, display: "inline-block" }} />
                        {task.page.name.replace("Ambria ", "")}
                      </div>

                      {/* Event name */}
                      <div className="card-event">{task.event.name}</div>

                      {/* Date + countdown */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="card-date">{formatDate(task.event.date)}</span>
                        {task.days >= 0 ? (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                            background: task.days <= 3 ? "rgba(239,83,80,0.15)" : task.days <= 7 ? "rgba(255,179,0,0.12)" : "rgba(255,255,255,0.05)",
                            color: task.days <= 3 ? "#EF5350" : task.days <= 7 ? "#FFB300" : "rgba(255,255,255,0.35)",
                          }}>
                            {task.days === 0 ? "TODAY" : `${task.days}d`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(239,83,80,0.12)", color: "#EF5350" }}>
                            {Math.abs(task.days)}d ago
                          </span>
                        )}
                      </div>

                      {/* Action tags */}
                      <div className="card-actions">
                        {task.event.actions.map(a => {
                          const at = ACTION_TYPES[a];
                          return <span key={a} style={{ background: at.bg, color: at.color }}>{at.icon} {at.label}</span>;
                        })}
                      </div>

                      {/* Ad timeline if applicable */}
                      {task.event.actions.includes("ad") && task.event.adLeadDays && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 4 }}>
                            ✎ Creative by {formatDate(getCreativeDeadline(task.event.date, task.event.adLeadDays))}
                          </span>
                          <span style={{ fontSize: 9, color: "rgba(230,81,0,0.6)", background: "rgba(230,81,0,0.06)", padding: "2px 6px", borderRadius: 4 }}>
                            ▲ Ads from {formatDate(getAdStartDate(task.event.date, task.event.adLeadDays))}
                          </span>
                        </div>
                      )}

                      {/* Expanded: note + move buttons */}
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
