import { useState, useMemo } from "react";
import { PAGES, REMINDER_TYPES } from "../lib/constants.js";
import { daysUntil, formatDate, getCreativeDeadline, getAdStartDate, getStoryReminder } from "../lib/helpers.js";
import Chip from "./shared/Chip.jsx";
import EmptyState from "./shared/EmptyState.jsx";

export default function RemindersView({ allEvents, data }) {
  const [filter, setFilter] = useState("all_upcoming");

  // Generate all reminders from all events
  const reminders = useMemo(() => {
    const list = [];
    const today = new Date(); today.setHours(0,0,0,0);

    allEvents.forEach(evt => {
      const eventDays = daysUntil(evt.date);
      if (eventDays < -7) return; // skip events more than a week past

      const hasAd = (evt.actions || []).includes("ad");
      const adLead = evt.adLeadDays || 15;

      // Story reminder: 7 days before event
      if ((evt.actions || []).includes("story") || true) {
        const rDate = getStoryReminder(evt.date);
        const rDays = daysUntil(rDate);
        list.push({
          type: "story_reminder", event: evt, date: rDate, daysUntil: rDays, eventDate: evt.date,
          message: `Prepare stories for "${evt.name}" across ${(evt.pages || []).length} pages`,
        });
      }

      // Ad creative deadline: adLeadDays + 10 days before event
      if (hasAd) {
        const cDate = getCreativeDeadline(evt.date, adLead);
        const cDays = daysUntil(cDate);
        list.push({
          type: "creative_deadline", event: evt, date: cDate, daysUntil: cDays, eventDate: evt.date,
          message: `Creative team: Ad for "${evt.name}" must be ready. Ad goes live in 10 days.`,
        });
      }

      // Ad start date: adLeadDays before event
      if (hasAd) {
        const aDate = getAdStartDate(evt.date, adLead);
        const aDays = daysUntil(aDate);
        list.push({
          type: "ad_start", event: evt, date: aDate, daysUntil: aDays, eventDate: evt.date,
          message: `Start running ads for "${evt.name}". Event in ${adLead} days.`,
        });
      }

      // Event day itself
      list.push({
        type: "event_day", event: evt, date: evt.date, daysUntil: eventDays, eventDate: evt.date,
        message: `"${evt.name}" is ${eventDays === 0 ? "TODAY" : eventDays === 1 ? "TOMORROW" : `in ${eventDays} days`}`,
      });
    });

    // Sort by date
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [allEvents]);

  // Filter
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

  // Stats
  const todayCount = reminders.filter(r => r.daysUntil === 0).length;
  const weekCount = reminders.filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).length;
  const overdueCount = reminders.filter(r => r.daysUntil < 0 && r.daysUntil >= -3).length;

  // Group by date
  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(r => {
      if (!g[r.date]) g[r.date] = [];
      g[r.date].push(r);
    });
    return g;
  }, [filtered]);

  return (
    <div>
      <style>{`
        .reminder-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 14px 18px; margin-bottom: 6px;
          transition: all 0.15s; position: relative; overflow: hidden;
        }
        .reminder-card:hover { background: rgba(255,255,255,0.045); }
        .reminder-card.urgent { border-color: rgba(239,83,80,0.25); background: rgba(239,83,80,0.03); }
        .reminder-card.today-card { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.04); }
        .reminder-card.overdue-card { border-color: rgba(239,83,80,0.3); background: rgba(239,83,80,0.05); }
        .date-divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0 10px; padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .date-divider-label { font-family: 'Outfit'; font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.75); }
        .date-divider-sub { font-size: 11px; color: rgba(255,255,255,0.3); }
        .reminder-type-icon {
          width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0;
        }
        .r-pages { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
        .r-page-dot { font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#fff 30%,#EF5350 70%,#FFB300)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
          Reminders & Deadlines
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Auto-calculated creative deadlines, ad launch dates, and story reminders for every event</p>
      </div>

      {/* Urgency stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {overdueCount > 0 && (
          <div style={{ background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 700, color: "#EF5350" }}>{overdueCount}</span>
            <span style={{ fontSize: 11, color: "#EF5350", textTransform: "uppercase", fontWeight: 600 }}>Overdue</span>
          </div>
        )}
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>{todayCount}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Today</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 700, color: "#FFB300" }}>{weekCount}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>This Week</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {Object.entries(REMINDER_TYPES).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            <span style={{ color: v.color, fontWeight: 700 }}>{v.icon}</span> {v.label}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { v: "all_upcoming", l: "All Upcoming" },
          { v: "today", l: "Today" },
          { v: "this_week", l: "This Week" },
          { v: "overdue", l: "⚠ Overdue" },
          { v: "creative", l: "✎ Creative Deadlines" },
          { v: "ads", l: "▲ Ad Launch" },
          { v: "stories", l: "◎ Story Reminders" },
        ].map(f => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)}>{f.l}</Chip>)}
      </div>

      {/* Reminders list grouped by date */}
      {filtered.length === 0 && <EmptyState msg="No reminders match this filter. You're all caught up!" />}

      {Object.entries(grouped).map(([date, items]) => {
        const d = daysUntil(date);
        const isToday = d === 0;
        const isPast = d < 0;
        const dayLabel = isToday ? "Today" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : isPast ? `${Math.abs(d)} days ago` : `In ${d} days`;

        return (
          <div key={date}>
            <div className="date-divider">
              <span className="date-divider-label" style={{ color: isToday ? "#C9A84C" : isPast ? "#EF5350" : "rgba(255,255,255,0.75)" }}>
                {formatDate(date)}
              </span>
              <span className="date-divider-sub">{dayLabel}</span>
              <span className="date-divider-sub">({items.length} item{items.length > 1 ? "s" : ""})</span>
            </div>

            {items.map((r, ri) => {
              const rt = REMINDER_TYPES[r.type];
              const priorityColors = ["#78909C","#FFB300","#F4511E","#D50000"];
              const cardClass = `reminder-card ${r.daysUntil === 0 ? "today-card" : ""} ${r.daysUntil < 0 ? "overdue-card" : ""} ${r.daysUntil >= 0 && r.daysUntil <= 2 ? "urgent" : ""}`;

              return (
                <div key={ri} className={cardClass}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: rt.color, borderRadius: "3px 0 0 3px" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div className="reminder-type-icon" style={{ background: `${rt.color}18`, color: rt.color }}>
                      {rt.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: rt.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{rt.label}</span>
                        {r.daysUntil === 0 && <span style={{ fontSize: 9, background: "rgba(201,168,76,0.2)", color: "#C9A84C", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TODAY</span>}
                        {r.daysUntil < 0 && <span style={{ fontSize: 9, background: "rgba(239,83,80,0.15)", color: "#EF5350", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>OVERDUE</span>}
                        {r.daysUntil === 1 && <span style={{ fontSize: 9, background: "rgba(255,179,0,0.12)", color: "#FFB300", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TOMORROW</span>}
                      </div>
                      <div style={{ fontFamily: "'Outfit'", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 3 }}>
                        {r.event.name}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 4 }}>
                        {r.message}
                      </div>
                      {/* Show which pages */}
                      {(r.event.pages || []).length > 0 && (
                        <div className="r-pages">
                          {r.event.pages.map(pid => {
                            const pg = PAGES.find(p => p.id === pid);
                            return pg ? <span key={pid} className="r-page-dot" style={{ background: `${pg.color}15`, color: pg.color }}>{pg.name.replace("Ambria ", "")}</span> : null;
                          })}
                        </div>
                      )}
                      {/* Ad timeline context for ad-related reminders */}
                      {(r.type === "creative_deadline" || r.type === "ad_start") && (
                        <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                          <span>✎ Creative by {formatDate(getCreativeDeadline(r.event.date, r.event.adLeadDays || 15))}</span>
                          <span>→</span>
                          <span>▲ Ads from {formatDate(getAdStartDate(r.event.date, r.event.adLeadDays || 15))}</span>
                          <span>→</span>
                          <span>★ Event {formatDate(r.event.date)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", minWidth: 50 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: priorityColors[r.event.priority] || "#78909C", background: `${priorityColors[r.event.priority] || "#78909C"}15`, padding: "2px 8px", borderRadius: 5, marginBottom: 4 }}>
                        P{r.event.priority}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{r.event.cat}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
