import { useState, useEffect, useMemo, useCallback } from "react";
import { PAGES, STORAGE_KEYS } from "./lib/constants.js";
import { EVENTS } from "./lib/events.js";
import { daysUntil, getCreativeDeadline, getAdStartDate, getStoryReminder, uid, loadData, saveData } from "./lib/helpers.js";
import RemindersView from "./components/RemindersView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import WorkflowView from "./components/WorkflowView.jsx";
import AdRequestsView from "./components/AdRequestsView.jsx";
import PagesView from "./components/PagesView.jsx";

export default function AmbriaHub() {
  const [tab, setTab] = useState("reminders");
  const [data, setData] = useState({ workflow: {}, adRequests: [], customEvents: [], builtinEdits: {}, hiddenBuiltins: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const wf = loadData(STORAGE_KEYS.workflow) || {};
    const ads = loadData(STORAGE_KEYS.adRequests) || [];
    const ce = loadData(STORAGE_KEYS.customEvents) || [];
    const be = loadData(STORAGE_KEYS.builtinEdits) || {};
    const hb = loadData(STORAGE_KEYS.hiddenBuiltins) || [];
    setData({ workflow: wf, adRequests: ads, customEvents: ce, builtinEdits: be, hiddenBuiltins: hb });
    setLoaded(true);
  }, []);

  const updateWorkflow = useCallback((eventKey, pageId, field, value) => {
    setData(prev => {
      const wf = { ...prev.workflow };
      if (!wf[eventKey]) wf[eventKey] = {};
      if (!wf[eventKey][pageId]) wf[eventKey][pageId] = {};
      wf[eventKey][pageId][field] = value;
      saveData(STORAGE_KEYS.workflow, wf);
      return { ...prev, workflow: wf };
    });
  }, []);

  // Custom events CRUD
  const addEvent = useCallback((evt) => {
    setData(prev => {
      const ce = [...prev.customEvents, { ...evt, id: uid(), custom: true }];
      saveData(STORAGE_KEYS.customEvents, ce);
      return { ...prev, customEvents: ce };
    });
  }, []);

  // Universal update — works for both custom and built-in
  const updateEvent = useCallback((id, updates, isBuiltin) => {
    if (isBuiltin) {
      setData(prev => {
        const be = { ...prev.builtinEdits, [id]: { ...(prev.builtinEdits[id] || {}), ...updates } };
        saveData(STORAGE_KEYS.builtinEdits, be);
        return { ...prev, builtinEdits: be };
      });
    } else {
      setData(prev => {
        const ce = prev.customEvents.map(e => e.id === id ? { ...e, ...updates } : e);
        saveData(STORAGE_KEYS.customEvents, ce);
        return { ...prev, customEvents: ce };
      });
    }
  }, []);

  // Universal delete — works for both custom and built-in
  const deleteEvent = useCallback((id, isBuiltin) => {
    if (isBuiltin) {
      setData(prev => {
        const hb = [...prev.hiddenBuiltins, id];
        const be = { ...prev.builtinEdits };
        delete be[id];
        saveData(STORAGE_KEYS.hiddenBuiltins, hb);
        saveData(STORAGE_KEYS.builtinEdits, be);
        return { ...prev, hiddenBuiltins: hb, builtinEdits: be };
      });
    } else {
      setData(prev => {
        const ce = prev.customEvents.filter(e => e.id !== id);
        saveData(STORAGE_KEYS.customEvents, ce);
        return { ...prev, customEvents: ce };
      });
    }
  }, []);

  // Restore a deleted built-in event
  const restoreBuiltin = useCallback((id) => {
    setData(prev => {
      const hb = prev.hiddenBuiltins.filter(x => x !== id);
      saveData(STORAGE_KEYS.hiddenBuiltins, hb);
      return { ...prev, hiddenBuiltins: hb };
    });
  }, []);

  // Reset a built-in event to defaults
  const resetBuiltin = useCallback((id) => {
    setData(prev => {
      const be = { ...prev.builtinEdits };
      delete be[id];
      saveData(STORAGE_KEYS.builtinEdits, be);
      return { ...prev, builtinEdits: be };
    });
  }, []);

  const addAdRequest = useCallback((req) => {
    setData(prev => {
      const ads = [...prev.adRequests, { ...req, id: uid(), createdAt: new Date().toISOString(), status: "requested" }];
      saveData(STORAGE_KEYS.adRequests, ads);
      return { ...prev, adRequests: ads };
    });
  }, []);

  const updateAdRequest = useCallback((id, updates) => {
    setData(prev => {
      const ads = prev.adRequests.map(a => a.id === id ? { ...a, ...updates } : a);
      saveData(STORAGE_KEYS.adRequests, ads);
      return { ...prev, adRequests: ads };
    });
  }, []);

  const deleteAdRequest = useCallback((id) => {
    setData(prev => {
      const ads = prev.adRequests.filter(a => a.id !== id);
      saveData(STORAGE_KEYS.adRequests, ads);
      return { ...prev, adRequests: ads };
    });
  }, []);

  // Merge built-in EVENTS (with overrides applied, hidden ones removed) + customEvents
  const allEvents = useMemo(() => {
    const hiddenSet = new Set(data.hiddenBuiltins);
    const builtIn = EVENTS
      .map(e => {
        const id = `builtin-${e.date}-${e.name}`;
        if (hiddenSet.has(id)) return null;
        const overrides = data.builtinEdits[id];
        return { ...e, ...(overrides || {}), id, custom: false, edited: !!overrides };
      })
      .filter(Boolean);
    const custom = data.customEvents.map(e => ({ ...e, custom: true }));
    return [...builtIn, ...custom].sort((a,b) => a.date.localeCompare(b.date));
  }, [data.customEvents, data.builtinEdits, data.hiddenBuiltins]);

  // Count hidden built-ins for restore UI
  const hiddenCount = data.hiddenBuiltins.length;

  if (!loaded) return <div style={{ background: "#08080e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "sans-serif" }}>Loading Ambria Hub...</div>;

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
        {tab === "calendar" && <CalendarView allEvents={allEvents} data={data} updateWorkflow={updateWorkflow} addEvent={addEvent} updateEvent={updateEvent} deleteEvent={deleteEvent} resetBuiltin={resetBuiltin} restoreBuiltin={restoreBuiltin} hiddenCount={hiddenCount} hiddenBuiltins={data.hiddenBuiltins} />}
        {tab === "workflow" && <WorkflowView data={data} updateWorkflow={updateWorkflow} allEvents={allEvents} />}
        {tab === "ads" && <AdRequestsView data={data} addAdRequest={addAdRequest} updateAdRequest={updateAdRequest} deleteAdRequest={deleteAdRequest} />}
        {tab === "pages" && <PagesView allEvents={allEvents} />}
      </div>
    </div>
  );
}
