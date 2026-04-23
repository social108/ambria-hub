import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { supabase } from "../supabaseClient.js";
import { daysUntil, getCreativeDeadline, getAdStartDate, getStoryReminder } from "../lib/helpers.js";
import useEvents from "../hooks/useEvents.js";
import useWorkflow from "../hooks/useWorkflow.js";
import useAdRequests from "../hooks/useAdRequests.js";
import useRealtimeSync from "../hooks/useRealtimeSync.js";
import useIsMobile from "../hooks/useIsMobile.js";
import RemindersView from "../components/RemindersView.jsx";
import CalendarView from "../components/CalendarView.jsx";
import WorkflowView from "../components/WorkflowView.jsx";
import AdRequestsView from "../components/AdRequestsView.jsx";
import PagesView from "../components/PagesView.jsx";
import TeamView from "../components/TeamView.jsx";
import logo from "../assets/logo.png";

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
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPw: "", confirmPw: "" });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mob = useIsMobile();

  const handleChangePassword = async () => {
    setPwStatus(null);
    if (!pwForm.newPw || !pwForm.confirmPw) { setPwStatus({ type: "error", msg: "Both fields are required" }); return; }
    if (pwForm.newPw.length < 6) { setPwStatus({ type: "error", msg: "Password must be at least 6 characters" }); return; }
    if (pwForm.newPw !== pwForm.confirmPw) { setPwStatus({ type: "error", msg: "Passwords don't match" }); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      setPwStatus({ type: "success", msg: "Password updated!" });
      setPwForm({ newPw: "", confirmPw: "" });
      setTimeout(() => { setShowPwModal(false); setPwStatus(null); }, 1500);
    } catch (e) {
      setPwStatus({ type: "error", msg: e.message });
    } finally {
      setPwSaving(false);
    }
  };

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

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

  // Compute urgent count once, reuse in top bar and drawer
  const urgentCount = useMemo(() => {
    if (!allEvents) return 0;
    return allEvents.filter(e => {
      const d = daysUntil(e.date);
      if (d < 0) return false;
      const hasAd = (e.actions || []).includes("ad");
      const adLead = e.adLeadDays || 15;
      const creativeDeadlineDays = daysUntil(getCreativeDeadline(e.date, adLead));
      const adStartDays = daysUntil(getAdStartDate(e.date, adLead));
      const storyDays = daysUntil(getStoryReminder(e.date));
      return (d >= 0 && d <= 7) || (hasAd && creativeDeadlineDays >= -2 && creativeDeadlineDays <= 5) || (hasAd && adStartDays >= -2 && adStartDays <= 3) || (storyDays >= -1 && storyDays <= 3);
    }).length;
  }, [allEvents]);

  const navTabs = useMemo(() => {
    const tabs = [
      { id: "reminders", icon: "🔔", label: "Reminders" },
      { id: "calendar", icon: "◎", label: "Calendar" },
      { id: "workflow", icon: "✦", label: "Workflow" },
      { id: "ads", icon: "▲", label: "Ad Requests" },
      { id: "pages", icon: "◆", label: "Pages" },
    ];
    if (role === "admin") tabs.push({ id: "team", icon: "👥", label: "Team" });
    return tabs;
  }, [role]);

  if (loading) return (
    <div style={{ background: "#F7F6F3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontFamily: "sans-serif" }}>
      Loading Ambria Hub...
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        .dash-nav-tabs::-webkit-scrollbar { display: none; }
        @keyframes drawerSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes drawerOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pwFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

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

      {/* ═══ MOBILE TOP BAR ═══ */}
      {mob && (
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 56,
          background: "#ffffff", borderBottom: "1px solid #eeeee9",
          position: "sticky", top: 0, zIndex: 1000,
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, width: 36, height: 36, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}
          >
            <div style={{ width: 20, height: 2, background: "#1a1a1a", borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: "#1a1a1a", borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: "#1a1a1a", borderRadius: 1 }} />
          </button>

          {/* Center: logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
              <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 13, color: "#1a1a1a", letterSpacing: 1 }}>AMBRIA HUB</span>
            {urgentCount > 0 && (
              <span style={{
                position: "absolute", top: -6, right: -18,
                background: "#EF5350", color: "#fff", fontSize: 9, fontWeight: 800,
                borderRadius: "50%", width: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{urgentCount > 9 ? "9+" : urgentCount}</span>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: "none", border: "none", color: "#6b7280",
              fontSize: 12, cursor: loggingOut ? "default" : "pointer", padding: "4px 8px",
            }}
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </nav>
      )}

      {/* ═══ MOBILE DRAWER ═══ */}
      {mob && (
        <>
          {/* Overlay */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
                zIndex: 1001, animation: "drawerOverlayIn 0.2s ease",
              }}
            />
          )}

          {/* Drawer panel */}
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 280, background: "#fff", zIndex: 1002,
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
            display: "flex", flexDirection: "column",
            boxShadow: drawerOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
          }}>
            {/* Drawer header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                  <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 14, color: "#1a1a1a", letterSpacing: 1 }}>AMBRIA HUB</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
              {navTabs.map(t => {
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setDrawerOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      width: "100%", padding: "14px 24px",
                      background: isActive ? "#f5f4f1" : "transparent",
                      border: "none", borderLeft: isActive ? "3px solid #1a1a1a" : "3px solid transparent",
                      cursor: "pointer", transition: "background 0.15s",
                      fontSize: 15, fontWeight: isActive ? 700 : 500, color: "#1a1a1a",
                      textAlign: "left", position: "relative",
                    }}
                  >
                    <span style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>
                    <span>{t.label}</span>
                    {t.id === "reminders" && urgentCount > 0 && (
                      <span style={{
                        marginLeft: "auto", background: "#EF5350", color: "#fff",
                        fontSize: 10, fontWeight: 800, borderRadius: 10,
                        padding: "2px 7px", minWidth: 20, textAlign: "center",
                      }}>{urgentCount > 9 ? "9+" : urgentCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom: user info + change password */}
            <div style={{ borderTop: "1px solid #eeeee9", padding: "16px 24px" }}>
              <button
                onClick={() => { setDrawerOpen(false); setShowPwModal(true); setPwStatus(null); setPwForm({ newPw: "", confirmPw: "" }); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "10px 0", fontSize: 13, color: "#6b7280", textAlign: "left",
                }}
              >
                Change Password
              </button>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{displayName}</div>
                <span style={{
                  display: "inline-block", marginTop: 4,
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  background: badge.bg, color: badge.color,
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  {(role || "viewer").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ DESKTOP NAV ═══ */}
      {!mob && (
        <nav style={{
          display: "flex", alignItems: "center", gap: 8, padding: "14px 24px",
          background: "#ffffff", borderBottom: "1px solid #eeeee9",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 20, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
              <img src={logo} alt="Ambria" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 15, color: "#1a1a1a", letterSpacing: 1 }}>AMBRIA HUB</span>
          </div>
          <div className="dash-nav-tabs" style={{
            display: "flex", gap: 8, flex: 1, minWidth: 0,
            overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
          }}>
            {navTabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                background: tab === t.id ? "rgba(0,0,0,0.06)" : "transparent",
                color: tab === t.id ? "#1a1a1a" : "#9ca3af",
                transition: "all 0.2s", position: "relative",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span>{t.label}</span>
                {t.id === "reminders" && urgentCount > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -4, background: "#EF5350", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{urgentCount > 9 ? "9+" : urgentCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Right side: user info + logout */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{displayName}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              background: badge.bg, color: badge.color,
              textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              {(role || "viewer").replace("_", " ")}
            </span>
            <button
              onClick={() => { setShowPwModal(true); setPwStatus(null); setPwForm({ newPw: "", confirmPw: "" }); }}
              style={{
                background: "none", border: "none", color: "#9ca3af",
                fontSize: 11, cursor: "pointer", padding: "4px 6px", transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#1a1a1a"; }}
              onMouseLeave={(e) => { e.target.style.color = "#9ca3af"; }}
            >
              Password
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                background: "none", border: "none", color: "#6b7280",
                fontSize: 12, cursor: loggingOut ? "default" : "pointer",
                padding: "4px 8px", transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.color = "#dc2626"; }}
              onMouseLeave={(e) => { e.target.style.color = "#6b7280"; }}
            >
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>
        </nav>
      )}

      {/* Change Password Modal */}
      {showPwModal && (
        <div
          onClick={() => setShowPwModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380,
              padding: mob ? 20 : 28, boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
              animation: "pwFadeIn 0.2s ease-out",
            }}
          >
            <h3 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 18, margin: "0 0 18px" }}>Change Password</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>New Password</div>
                <input
                  type="password" value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  placeholder="Min 6 characters"
                  style={{ width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13 }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Confirm Password</div>
                <input
                  type="password" value={pwForm.confirmPw}
                  onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                  placeholder="Re-enter password"
                  style={{ width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13 }}
                />
              </div>
            </div>
            {pwStatus && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                background: pwStatus.type === "error" ? "rgba(239,83,80,0.08)" : "rgba(102,187,106,0.12)",
                color: pwStatus.type === "error" ? "#dc2626" : "#2E7D32",
              }}>
                {pwStatus.msg}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPwModal(false)}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e5e0", background: "#f5f4f1", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >Cancel</button>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: pwSaving ? "#d1d5db" : "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: pwSaving ? "default" : "pointer" }}
              >{pwSaving ? "Saving..." : "Update Password"}</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ padding: mob ? "12px 10px" : "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "reminders" && <RemindersView allEvents={allEvents} data={data} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} setTab={setTab} role={role} />}
        {tab === "calendar" && <CalendarView allEvents={allEvents} data={data} updateWorkflow={updateWorkflow} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} restoreBuiltin={restoreBuiltin} hiddenCount={hiddenCount} hiddenBuiltins={hiddenBuiltins} role={role} />}
        {tab === "workflow" && <WorkflowView data={data} updateWorkflow={updateWorkflow} allEvents={allEvents} role={role} />}
        {tab === "ads" && <AdRequestsView data={data} addAdRequest={addAdRequest} updateAdRequest={updateAdRequest} deleteAdRequest={deleteAdRequest} role={role} />}
        {tab === "pages" && <PagesView allEvents={allEvents} />}
        {tab === "team" && role === "admin" && <TeamView />}
      </div>
    </div>
  );
}
