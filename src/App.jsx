import { useState } from "react";
import { daysUntil, getCreativeDeadline, getAdStartDate, getStoryReminder } from "./lib/helpers.js";
import useEvents from "./hooks/useEvents.js";
import useWorkflow from "./hooks/useWorkflow.js";
import useAdRequests from "./hooks/useAdRequests.js";
import useRealtimeSync from "./hooks/useRealtimeSync.js";
import RemindersView from "./components/RemindersView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import WorkflowView from "./components/WorkflowView.jsx";
import AdRequestsView from "./components/AdRequestsView.jsx";
import PagesView from "./components/PagesView.jsx";

export default function AmbriaHub() {
  const [tab, setTab] = useState("reminders");

  const {
    allEvents, addEvent, updateEvent, deleteEvent,
    restoreBuiltin, resetBuiltin, hiddenCount, hiddenBuiltins,
    loading: eventsLoading, refetch: refetchEvents,
  } = useEvents();

  const {
    workflowData, updateWorkflow,
    loading: workflowLoading, refetch: refetchWorkflow,
  } = useWorkflow();

  const {
    adRequests, addAdRequest, updateAdRequest, deleteAdRequest,
    loading: adsLoading, refetch: refetchAdRequests,
  } = useAdRequests();

  useRealtimeSync({ refetchEvents, refetchWorkflow, refetchAdRequests });

  const loading = eventsLoading || workflowLoading || adsLoading;

  // Build the data object that child components expect
  const data = { workflow: workflowData, adRequests };

  if (loading) return <div style={{ background: "#08080e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "sans-serif" }}>Loading Ambria Hub...</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#08080e", minHeight: "100vh", color: "#ddd" }}>
      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 8, padding: "14px 24px",
        background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)",
      }}>
        <div style={{ fontFamily: "'Outfit'", fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#C9A84C,#F6AD55)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginRight: 20 }}>
          AMBRIA HUB
        </div>
        {[
          { id: "reminders", label: "🔔 Reminders" },
          { id: "calendar", label: "◎ Calendar" },
          { id: "workflow", label: "✦ Workflow Board" },
          { id: "ads", label: "▲ Ad Requests" },
          { id: "pages", label: "◆ Pages" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t.id ? "rgba(201,168,76,0.2)" : "transparent",
            color: tab === t.id ? "#C9A84C" : "rgba(255,255,255,0.45)",
            transition: "all 0.2s", position: "relative",
          }}>
            {t.label}
            {t.id === "reminders" && (() => {
              const urgentCount = allEvents.filter(e => {
                const d = daysUntil(e.date);
                if (d < 0) return false;
                const hasAd = (e.actions || []).includes("ad");
                const adLead = e.adLeadDays || 15;
                const creativeDeadlineDays = daysUntil(getCreativeDeadline(e.date, adLead));
                const adStartDays = daysUntil(getAdStartDate(e.date, adLead));
                const storyDays = daysUntil(getStoryReminder(e.date));
                return (d >= 0 && d <= 7) || (hasAd && creativeDeadlineDays >= -2 && creativeDeadlineDays <= 5) || (hasAd && adStartDays >= -2 && adStartDays <= 3) || (storyDays >= -1 && storyDays <= 3);
              }).length;
              return urgentCount > 0 ? (
                <span style={{ position: "absolute", top: -2, right: -4, background: "#EF5350", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{urgentCount > 9 ? "9+" : urgentCount}</span>
              ) : null;
            })()}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "reminders" && <RemindersView allEvents={allEvents} data={data} />}
        {tab === "calendar" && <CalendarView allEvents={allEvents} data={data} updateWorkflow={updateWorkflow} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} restoreBuiltin={restoreBuiltin} hiddenCount={hiddenCount} hiddenBuiltins={hiddenBuiltins} />}
        {tab === "workflow" && <WorkflowView data={data} updateWorkflow={updateWorkflow} allEvents={allEvents} />}
        {tab === "ads" && <AdRequestsView data={data} addAdRequest={addAdRequest} updateAdRequest={updateAdRequest} deleteAdRequest={deleteAdRequest} />}
        {tab === "pages" && <PagesView allEvents={allEvents} />}
      </div>
    </div>
  );
}
