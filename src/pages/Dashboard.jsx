import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { daysUntil, getCreativeDeadline, getAdStartDate, getStoryReminder } from "../lib/helpers.js";
import useEvents from "../hooks/useEvents.js";
import useWorkflow from "../hooks/useWorkflow.js";
import useAdRequests from "../hooks/useAdRequests.js";
import useRealtimeSync from "../hooks/useRealtimeSync.js";
import RemindersView from "../components/RemindersView.jsx";
import CalendarView from "../components/CalendarView.jsx";
import WorkflowView from "../components/WorkflowView.jsx";
import AdRequestsView from "../components/AdRequestsView.jsx";
import PagesView from "../components/PagesView.jsx";

const roleBadgeColors = {
  admin: { bg: "rgba(201,168,76,0.15)", color: "#92750a" },
  creative: { bg: "rgba(66,165,245,0.12)", color: "#1976D2" },
  venue_manager: { bg: "rgba(102,187,106,0.12)", color: "#2E7D32" },
  viewer: { bg: "#f3f2ef", color: "#6b7280" },
};

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const [tab, setTab] = useState("reminders");
  const [loggingOut, setLoggingOut] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncError, setSyncError] = useState(null);

  // Offline detection
  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Sync error handler — auto-dismiss after 4s
  const handleSyncError = useCallback((msg) => {
    setSyncError(msg);
    setTimeout(() => setSyncError(null), 4000);
  }, []);

  const {
    allEvents, addEvent, updateEvent, deleteEvent,
    restoreBuiltin, resetBuiltin, hiddenCount, hiddenBuiltins,
    loading: eventsLoading, refetch: refetchEvents,
  } = useEvents({ onSyncError: handleSyncError });

  const {
    workflowData, updateWorkflow,
    loading: workflowLoading, refetch: refetchWorkflow,
  } = useWorkflow({ onSyncError: handleSyncError });

  const {
    adRequests, addAdRequest, updateAdRequest, deleteAdRequest,
    loading: adsLoading, refetch: refetchAdRequests,
  } = useAdRequests({ onSyncError: handleSyncError });

  useRealtimeSync({ refetchEvents, refetchWorkflow, refetchAdRequests });

  const loading = eventsLoading || workflowLoading || adsLoading;
  const data = { workflow: workflowData, adRequests };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const badge = roleBadgeColors[role] || roleBadgeColors.viewer;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); } catch { setLoggingOut(false); }
  };

  if (loading) return (
    <div style={{ background: "#F7F6F3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontFamily: "sans-serif" }}>
      Loading Ambria Hub...
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* Offline banner */}
      {offline && (
        <div style={{
          background: "rgba(255,179,0,0.1)", color: "#92400e",
          textAlign: "center", padding: "6px 0", fontSize: 12, fontWeight: 600,
          borderBottom: "1px solid rgba(255,179,0,0.2)",
        }}>
          You're offline — changes won't sync
        </div>
      )}

      {/* Sync error toast */}
      {syncError && (
        <div style={{
          background: "rgba(239,83,80,0.08)", color: "#dc2626",
          textAlign: "center", padding: "6px 0", fontSize: 12, fontWeight: 600,
          borderBottom: "1px solid rgba(239,83,80,0.2)",
        }}>
          {syncError}
        </div>
      )}

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 8, padding: "14px 24px",
        background: "#ffffff", borderBottom: "1px solid #eeeee9",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 20 }}>
          <img src={import.meta.env.BASE_URL + "logo.png"} alt="Ambria" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 15, color: "#1a1a1a", letterSpacing: 1 }}>AMBRIA HUB</span>
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
            background: tab === t.id ? "rgba(0,0,0,0.06)" : "transparent",
            color: tab === t.id ? "#1a1a1a" : "#9ca3af",
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

        {/* Right side: user info + logout */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{displayName}</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: badge.bg,
            color: badge.color,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            {(role || "viewer").replace("_", " ")}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: 12,
              cursor: loggingOut ? "default" : "pointer",
              padding: "4px 8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.color = "#dc2626"; }}
            onMouseLeave={(e) => { e.target.style.color = "#6b7280"; }}
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "reminders" && <RemindersView allEvents={allEvents} data={data} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} setTab={setTab} />}
        {tab === "calendar" && <CalendarView allEvents={allEvents} data={data} updateWorkflow={updateWorkflow} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} restoreBuiltin={restoreBuiltin} hiddenCount={hiddenCount} hiddenBuiltins={hiddenBuiltins} />}
        {tab === "workflow" && <WorkflowView data={data} updateWorkflow={updateWorkflow} allEvents={allEvents} />}
        {tab === "ads" && <AdRequestsView data={data} addAdRequest={addAdRequest} updateAdRequest={updateAdRequest} deleteAdRequest={deleteAdRequest} />}
        {tab === "pages" && <PagesView allEvents={allEvents} />}
      </div>
    </div>
  );
}
