import { useState, useEffect, useMemo, useCallback } from "react";

// ─── CONSTANTS ───
const PAGES = [
  { id: "ambria_in", name: "Ambria.in", handle: "@ambria.in", url: "https://www.instagram.com/ambria.in/", color: "#C9A84C", desc: "Master page · Bridal inspiration · Collabs", noAds: true },
  { id: "restro", name: "Ambria Restro", handle: "@ambriarestro", url: "https://www.instagram.com/ambriarestro/", color: "#E57373", desc: "Restaurant · Funny content · Dishes · Glasshouse Banquet · Farm" },
  { id: "cuisine", name: "Ambria Cuisine", handle: "@ambriacuisines", url: "https://www.instagram.com/ambriacuisines/", color: "#FFB74D", desc: "Catering · Food collabs with Restro" },
  { id: "decor", name: "Ambria Design & Decor", handle: "@ambria.designanddecor", url: "https://www.instagram.com/ambria.designanddecor/", color: "#F48FB1", desc: "Decor BTS · Premium themes" },
  { id: "manaktala", name: "Ambria Manaktala", handle: "@ambriamanaktala", url: "https://www.instagram.com/ambriamanaktala/", color: "#81C784", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "pushpanjali", name: "Ambria Pushpanjali", handle: "@ambriapushpanjali", url: "https://www.instagram.com/ambriapushpanjali/", color: "#64B5F6", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "exotica", name: "Ambria Exotica", handle: "@ambriaexotica", url: "https://www.instagram.com/ambriaexotica/", color: "#BA68C8", desc: "Venue · Decor · Catering · Entertainment" },
  { id: "events", name: "Ambria Events", handle: "@ambriaevents", url: "https://www.instagram.com/ambriaevents/", color: "#4DD0E1", desc: "Entertainment · Band Baaja · DJ · Singers · Jaimala" },
];

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ACTION_TYPES = {
  story: { label: "Story Post", icon: "◎", color: "#43A047", bg: "#E8F5E9" },
  ad: { label: "Run Ads", icon: "▲", color: "#E65100", bg: "#FFF3E0" },
  host: { label: "Host Event", icon: "★", color: "#AD1457", bg: "#FCE4EC" },
  restaurant: { label: "Restaurant Special", icon: "◆", color: "#4527A0", bg: "#EDE7F6" },
  reel: { label: "Reel / Video", icon: "▶", color: "#00695C", bg: "#E0F7FA" },
};

const WORKFLOW_STATUS = {
  pending: { label: "Pending", color: "#78909C", bg: "rgba(120,144,156,0.12)" },
  creative_wip: { label: "Creative WIP", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
  ready: { label: "Ready", color: "#66BB6A", bg: "rgba(102,187,106,0.12)" },
  posted: { label: "Posted", color: "#43A047", bg: "rgba(67,160,71,0.15)" },
  ad_live: { label: "Ad Live", color: "#E65100", bg: "rgba(230,81,0,0.12)" },
  completed: { label: "Completed", color: "#7E57C2", bg: "rgba(126,87,194,0.12)" },
  skipped: { label: "Skipped", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
};

const AD_REQUEST_STATUS = {
  requested: { label: "Requested", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
  creative_wip: { label: "Creative WIP", color: "#42A5F5", bg: "rgba(66,165,245,0.12)" },
  approved: { label: "Approved", color: "#66BB6A", bg: "rgba(102,187,106,0.12)" },
  live: { label: "Ad Live", color: "#E65100", bg: "rgba(230,81,0,0.12)" },
  completed: { label: "Completed", color: "#7E57C2", bg: "rgba(126,87,194,0.12)" },
  rejected: { label: "Rejected", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
};

// ─── EVENT DATA ───
const EVENTS = [
  // JAN
  { date: "2026-01-01", name: "New Year's Day", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 20, note: "NYE party promos, brunch buffet, venue showcase for wedding bookings" },
  { date: "2026-01-13", name: "Lohri", cat: "Hindu Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","decor"], priority: 3, adLeadDays: 20, note: "Bonfire party, Punjabi themed event — pre-wedding season content" },
  { date: "2026-01-14", name: "Makar Sankranti", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festive greeting story" },
  { date: "2026-01-26", name: "Republic Day", cat: "National", actions: ["story"], pages: ["ambria_in","manaktala","pushpanjali","exotica"], priority: 1, note: "Tricolor themed story" },
  // FEB
  { date: "2026-02-05", name: "Basant Panchami", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in","decor"], priority: 1, note: "Yellow-themed story, spring decor inspiration" },
  { date: "2026-02-14", name: "Valentine's Day", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine"], priority: 3, adLeadDays: 20, note: "Couple dinner, candlelight buffet, love-themed decor, Valentine's party at venues" },
  { date: "2026-02-26", name: "Maha Shivaratri", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festival greeting" },
  // MAR
  { date: "2026-03-08", name: "International Women's Day", cat: "International", actions: ["story","reel"], pages: ["ambria_in","restro"], priority: 2, note: "Team spotlight reel, women in events" },
  { date: "2026-03-14", name: "Holi", cat: "Hindu Festival", actions: ["story","ad","host","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","restro","decor"], priority: 3, adLeadDays: 20, note: "Holi party — rain dance, colors, DJ, food stalls. Start ads early March" },
  { date: "2026-03-29", name: "Eid ul-Fitr", cat: "Muslim Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Eid Mubarak story, special feast buffet" },
  { date: "2026-03-31", name: "FY End Booking Push", cat: "Business", actions: ["ad"], pages: ["manaktala","pushpanjali","exotica"], priority: 3, adLeadDays: 30, note: "\"Book before March 31\" — corporate events & early wedding bookings" },
  // APR
  { date: "2026-04-02", name: "Ram Navami", cat: "Hindu Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Festive greeting" },
  { date: "2026-04-13", name: "Baisakhi", cat: "Sikh Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","cuisine"], priority: 2, adLeadDays: 15, note: "Baisakhi celebration, Punjabi food fest, bhangra night" },
  { date: "2026-04-20", name: "Easter", cat: "Christian", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Easter brunch, pastel themed content" },
  { date: "2026-04-15", name: "Wedding Season Ad Push", cat: "Business", actions: ["ad","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "Heavy wedding venue ads — real wedding reels, testimonials, venue tours" },
  // MAY
  { date: "2026-05-11", name: "Mother's Day", cat: "International", actions: ["story","ad","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, adLeadDays: 15, note: "Mother's Day brunch/lunch buffet, family celebration" },
  { date: "2026-05-15", name: "Summer Pool Party Launch", cat: "Seasonal", actions: ["story","ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 20, note: "Pool party — DJ, BBQ, cocktails. Start ads early May. Restro farm pool" },
  // JUN
  { date: "2026-06-05", name: "World Environment Day", cat: "International", actions: ["story","reel"], pages: ["ambria_in","decor"], priority: 1, note: "Eco-venue showcase, sustainable event practices" },
  { date: "2026-06-06", name: "Eid ul-Adha", cat: "Muslim Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 1, note: "Eid greeting, special feast menu" },
  { date: "2026-06-15", name: "Father's Day", cat: "International", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Father's Day dinner special" },
  { date: "2026-06-30", name: "Pool Parties Peak", cat: "Seasonal", actions: ["ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 15, note: "Weekly pool party weekends, BTS reels, influencer collabs" },
  // JUL
  { date: "2026-07-26", name: "Kargil Vijay Diwas", cat: "National", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Tribute story" },
  { date: "2026-07-31", name: "Monsoon Theme Party", cat: "Seasonal", actions: ["story","ad","host"], pages: ["restro","manaktala","events"], priority: 2, adLeadDays: 15, note: "Monsoon party, chai & pakora evening, rain-themed decor" },
  // AUG
  { date: "2026-08-09", name: "Raksha Bandhan", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Sibling celebration lunch/dinner buffet" },
  { date: "2026-08-15", name: "Independence Day", cat: "National", actions: ["story","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica"], priority: 2, note: "Patriotic content, tricolor decor showcase" },
  { date: "2026-08-16", name: "Janmashtami", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro","cuisine"], priority: 2, note: "Krishna-themed story, vegetarian feast" },
  // SEP
  { date: "2026-09-01", name: "Wedding Season Campaign Start", cat: "Business", actions: ["ad","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "BIGGEST AD PUSH — venue tours, real weddings, testimonials, decor showcase" },
  { date: "2026-09-05", name: "Teacher's Day", cat: "National", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Appreciation post" },
  { date: "2026-09-22", name: "Navratri / Dandiya Night", cat: "Hindu Festival", actions: ["story","ad","host","reel"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events","decor","restro"], priority: 3, adLeadDays: 20, note: "Dandiya/Garba night, 9-day color series, themed food stalls" },
  // OCT
  { date: "2026-10-02", name: "Dussehra", cat: "Hindu Festival", actions: ["story","ad","host"], pages: ["ambria_in","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 15, note: "Dussehra celebration, festive venue campaign" },
  { date: "2026-10-10", name: "Karwa Chauth", cat: "Hindu Festival", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","cuisine","decor"], priority: 3, adLeadDays: 20, note: "Karwa Chauth dinner — mehendi, sargi, moonrise, couples buffet at all venues" },
  { date: "2026-10-20", name: "Diwali", cat: "Hindu Festival", actions: ["story","ad","host","restaurant","reel"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine","decor"], priority: 3, adLeadDays: 25, note: "BIGGEST — Diwali party, gala dinner, corporate events, fireworks, decor showcase" },
  { date: "2026-10-22", name: "Bhai Dooj", cat: "Hindu Festival", actions: ["story","restaurant"], pages: ["ambria_in","restro"], priority: 1, note: "Sibling celebration menu" },
  { date: "2026-10-31", name: "Halloween Party", cat: "International", actions: ["story","ad","host","reel"], pages: ["restro","exotica","events"], priority: 3, adLeadDays: 20, note: "Halloween party — costume contest, spooky decor, themed cocktails" },
  // NOV
  { date: "2026-11-01", name: "Peak Wedding Season", cat: "Business", actions: ["ad","reel","story"], pages: ["ambria_in","manaktala","pushpanjali","exotica","decor","events","cuisine"], priority: 3, adLeadDays: 30, note: "Full throttle — daily wedding content, real wedding posts, venue showcases" },
  { date: "2026-11-15", name: "Guru Nanak Jayanti", cat: "Sikh Festival", actions: ["story"], pages: ["ambria_in"], priority: 1, note: "Guru Purab greeting" },
  { date: "2026-11-28", name: "Black Friday Booking Deals", cat: "Business", actions: ["ad","story"], pages: ["manaktala","pushpanjali","exotica"], priority: 2, adLeadDays: 15, note: "Black Friday venue booking deals, early bird wedding packages" },
  // DEC
  { date: "2026-12-15", name: "Winter Party Season", cat: "Seasonal", actions: ["ad","host","reel"], pages: ["restro","manaktala","pushpanjali","exotica","events"], priority: 3, adLeadDays: 20, note: "Winter wonderland events, corporate year-end bashes" },
  { date: "2026-12-25", name: "Christmas", cat: "International", actions: ["story","ad","host","restaurant"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine"], priority: 3, adLeadDays: 20, note: "Christmas party, Xmas brunch/dinner, winter decor, carol night" },
  { date: "2026-12-31", name: "New Year's Eve", cat: "International", actions: ["story","ad","host","restaurant","reel"], pages: ["ambria_in","restro","manaktala","pushpanjali","exotica","events","cuisine","decor"], priority: 3, adLeadDays: 20, note: "NYE gala — DJ, countdown, premium dinner. Ads from Dec 15" },
];

// ─── HELPERS ───
function getMonthIndex(dateStr) { return new Date(dateStr).getMonth(); }
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}
function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.ceil((target - now) / 86400000);
}
function getAdStartDate(dateStr, leadDays) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - leadDays);
  return d.toISOString().split("T")[0];
}
function getCreativeDeadline(dateStr, leadDays) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - leadDays - 10);
  return d.toISOString().split("T")[0];
}
function getStoryReminder(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

// ─── STORAGE ───
const STORAGE_KEYS = {
  workflow: "ambria-cal-workflow-v2",
  adRequests: "ambria-cal-ads-v2",
  customEvents: "ambria-cal-events-v2",
  builtinEdits: "ambria-cal-builtin-edits-v1",
  hiddenBuiltins: "ambria-cal-hidden-builtins-v1",
};

async function loadData(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function saveData(key, data) {
  try { await window.storage.set(key, JSON.stringify(data)); } catch(e) { console.error(e); }
}

// ─── MAIN APP ───
export default function AmbriaHub() {
  const [tab, setTab] = useState("reminders");
  const [data, setData] = useState({ workflow: {}, adRequests: [], customEvents: [], builtinEdits: {}, hiddenBuiltins: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const wf = await loadData(STORAGE_KEYS.workflow) || {};
      const ads = await loadData(STORAGE_KEYS.adRequests) || [];
      const ce = await loadData(STORAGE_KEYS.customEvents) || [];
      const be = await loadData(STORAGE_KEYS.builtinEdits) || {};
      const hb = await loadData(STORAGE_KEYS.hiddenBuiltins) || [];
      setData({ workflow: wf, adRequests: ads, customEvents: ce, builtinEdits: be, hiddenBuiltins: hb });
      setLoaded(true);
    })();
  }, []);

  const updateWorkflow = useCallback(async (eventKey, pageId, field, value) => {
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
  const addEvent = useCallback(async (evt) => {
    setData(prev => {
      const ce = [...prev.customEvents, { ...evt, id: uid(), custom: true }];
      saveData(STORAGE_KEYS.customEvents, ce);
      return { ...prev, customEvents: ce };
    });
  }, []);

  // Universal update — works for both custom and built-in
  const updateEvent = useCallback(async (id, updates, isBuiltin) => {
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
  const deleteEvent = useCallback(async (id, isBuiltin) => {
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
  const restoreBuiltin = useCallback(async (id) => {
    setData(prev => {
      const hb = prev.hiddenBuiltins.filter(x => x !== id);
      saveData(STORAGE_KEYS.hiddenBuiltins, hb);
      return { ...prev, hiddenBuiltins: hb };
    });
  }, []);

  // Reset a built-in event to defaults
  const resetBuiltin = useCallback(async (id) => {
    setData(prev => {
      const be = { ...prev.builtinEdits };
      delete be[id];
      saveData(STORAGE_KEYS.builtinEdits, be);
      return { ...prev, builtinEdits: be };
    });
  }, []);

  const addAdRequest = useCallback(async (req) => {
    setData(prev => {
      const ads = [...prev.adRequests, { ...req, id: uid(), createdAt: new Date().toISOString(), status: "requested" }];
      saveData(STORAGE_KEYS.adRequests, ads);
      return { ...prev, adRequests: ads };
    });
  }, []);

  const updateAdRequest = useCallback(async (id, updates) => {
    setData(prev => {
      const ads = prev.adRequests.map(a => a.id === id ? { ...a, ...updates } : a);
      saveData(STORAGE_KEYS.adRequests, ads);
      return { ...prev, adRequests: ads };
    });
  }, []);

  const deleteAdRequest = useCallback(async (id) => {
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

  if (!loaded) return <div style={{ background: "#F7F6F3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontFamily: "sans-serif" }}>Loading Ambria Hub...</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 8, padding: "14px 24px",
        background: "#ffffff", borderBottom: "1px solid #eeeee9",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)",
      }}>
        <div style={{ fontFamily: "'Sora'", fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginRight: 20 }}>
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
            background: tab === t.id ? "#f3f2ef" : "transparent",
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

// ═══════════════════════════════════════════
// REMINDERS VIEW — AUTO DEADLINE ALERTS
// ═══════════════════════════════════════════

const REMINDER_TYPES = {
  creative_deadline: { label: "Creative Deadline", icon: "✎", color: "#F48FB1", desc: "Creative team must have ad ready by this date" },
  ad_start: { label: "Start Running Ads", icon: "▲", color: "#FFB300", desc: "Ads should go live on this date" },
  story_reminder: { label: "Story Reminder", icon: "◎", color: "#43A047", desc: "Prepare and post story content" },
  event_day: { label: "Event Day", icon: "★", color: "#E65100", desc: "The event/festival itself" },
};

function RemindersView({ allEvents, data }) {
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
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 12px; padding: 14px 18px; margin-bottom: 6px;
          transition: all 0.15s; position: relative; overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .reminder-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .reminder-card.urgent { border-color: rgba(239,83,80,0.3); background: rgba(239,83,80,0.03); }
        .reminder-card.today-card { border-color: rgba(255,179,0,0.3); background: rgba(255,179,0,0.04); }
        .reminder-card.overdue-card { border-color: rgba(239,83,80,0.3); background: rgba(239,83,80,0.04); }
        .date-divider {
          display: flex; align-items: center; gap: 12px; margin: 18px 0 10px; padding-bottom: 6px;
          border-bottom: 1px solid #eeeee9;
        }
        .date-divider-label { font-family: 'Sora'; font-size: 14px; font-weight: 700; color: #374151; }
        .date-divider-sub { font-size: 11px; color: #9ca3af; }
        .reminder-type-icon {
          width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0;
        }
        .r-pages { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
        .r-page-dot { font-size: 9px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
          Reminders & Deadlines
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>Auto-calculated creative deadlines, ad launch dates, and story reminders for every event</p>
      </div>

      {/* Urgency stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {overdueCount > 0 && (
          <div style={{ background: "rgba(239,83,80,0.06)", border: "1px solid #eeeee9", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Sora'", fontSize: 22, fontWeight: 700, color: "#EF5350" }}>{overdueCount}</span>
            <span style={{ fontSize: 11, color: "#EF5350", textTransform: "uppercase", fontWeight: 600 }}>Overdue</span>
          </div>
        )}
        <div style={{ background: "rgba(255,179,0,0.06)", border: "1px solid #eeeee9", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Sora'", fontSize: 22, fontWeight: 700, color: "#C9A84C" }}>{todayCount}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>Today</span>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Sora'", fontSize: 22, fontWeight: 700, color: "#FFB300" }}>{weekCount}</span>
          <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>This Week</span>
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
              <span className="date-divider-label" style={{ color: isToday ? "#C9A84C" : isPast ? "#EF5350" : "#374151" }}>
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
                        {r.daysUntil === 0 && <span style={{ fontSize: 9, background: "rgba(255,179,0,0.12)", color: "#FFB300", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TODAY</span>}
                        {r.daysUntil < 0 && <span style={{ fontSize: 9, background: "rgba(239,83,80,0.15)", color: "#EF5350", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>OVERDUE</span>}
                        {r.daysUntil === 1 && <span style={{ fontSize: 9, background: "rgba(255,179,0,0.12)", color: "#FFB300", padding: "2px 8px", borderRadius: 5, fontWeight: 700 }}>TOMORROW</span>}
                      </div>
                      <div style={{ fontFamily: "'Sora'", fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 3 }}>
                        {r.event.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 4 }}>
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
                        <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, color: "#d1d5db" }}>
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
                      <div style={{ fontSize: 10, color: "#d1d5db" }}>{r.event.cat}</div>
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

// ═══════════════════════════════════════════
// CALENDAR VIEW — MONTHLY GRID + CRUD
// ═══════════════════════════════════════════

const EMPTY_FORM = { name: "", date: "", cat: "Seasonal", actions: [], pages: [], priority: 2, adLeadDays: 15, note: "" };
const CAT_OPTIONS = ["Hindu Festival","Muslim Festival","Sikh Festival","Christian","National","International","Seasonal","Business","Food & Lifestyle","Custom"];

function CalendarView({ allEvents, data, updateWorkflow, addEvent, updateEvent, deleteEvent, resetBuiltin, restoreBuiltin, hiddenCount, hiddenBuiltins }) {
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
        .cal-cell.today { background: rgba(255,179,0,0.06); }
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
          position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200;
          display: flex; align-items: center; justify-content: center;
          animation: calFadeIn 0.2s ease; backdrop-filter: blur(8px);
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
        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: "#1a1a1a", minWidth: 200, textAlign: "center" }}>
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
                  <button onClick={(ev) => { ev.stopPropagation(); handleDelete(evt); }} style={{ background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 6, padding: "3px 8px", color: "#EF5350", fontSize: 10, cursor: "pointer" }}>✕</button>
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
                    <button onClick={() => handleDelete(modal.event)} style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(239,83,80,0.3)", background: "rgba(239,83,80,0.08)", color: "#EF5350", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

const navBtnStyle = { background: "#f3f2ef", border: "1px solid #e5e5e0", borderRadius: 8, padding: "5px 14px", color: "#6b7280", fontSize: 18, cursor: "pointer", fontWeight: 600 };
const inputStyle = { width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13 };

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</div>;
}

function MiniChip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 6, border: `1px solid ${active ? (color || "#1a1a1a") : "#e5e5e0"}`,
      background: active ? `${color || "rgba(26,26,26,1)"}15` : "#ffffff",
      color: active ? (color || "#1a1a1a") : "#9ca3af",
      fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

// ═══════════════════════════════════════════
// WORKFLOW TRACKER VIEW — KANBAN BOARD
// ═══════════════════════════════════════════

const KANBAN_COLUMNS = [
  { id: "pending", label: "Pending", icon: "○", color: "#78909C", accent: "rgba(120,144,156,0.25)" },
  { id: "creative_wip", label: "Creative WIP", icon: "✎", color: "#FFB300", accent: "rgba(255,179,0,0.25)" },
  { id: "ready", label: "Ready to Post", icon: "✓", color: "#66BB6A", accent: "rgba(102,187,106,0.25)" },
  { id: "posted", label: "Posted", icon: "◎", color: "#43A047", accent: "rgba(67,160,71,0.25)" },
  { id: "ad_live", label: "Ad Live", icon: "▲", color: "#E65100", accent: "rgba(230,81,0,0.25)" },
  { id: "completed", label: "Done", icon: "★", color: "#7E57C2", accent: "rgba(126,87,194,0.25)" },
  { id: "skipped", label: "Skipped", icon: "✕", color: "#EF5350", accent: "rgba(239,83,80,0.25)" },
];

function WorkflowView({ data, updateWorkflow, allEvents }) {
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
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .kanban-col.drag-over { border-color: rgba(26,26,26,0.3); background: rgba(26,26,26,0.02); }
        .kanban-col-header {
          padding: 14px 14px 10px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #eeeee9; position: sticky; top: 0; z-index: 2;
          background: #ffffff;
        }
        .kanban-col-body { padding: 8px; flex: 1; overflow-y: auto; max-height: 65vh; }
        .kanban-card {
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 12px; padding: 10px 12px; margin-bottom: 6px;
          cursor: grab; transition: all 0.2s; position: relative;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .kanban-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e5e5e0; transform: translateY(-1px); }
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
        .card-move-btns { display: flex; gap: 4px; margin-top: 8px; animation: kFadeIn 0.15s ease; }
        .card-move-btn {
          flex: 1; padding: 5px 4px; border-radius: 6px; border: 1px solid #e5e5e0;
          background: #ffffff; color: #6b7280; font-size: 9.5px;
          font-weight: 600; cursor: pointer; text-align: center; transition: all 0.15s;
        }
        .card-move-btn:hover { background: #f3f2ef; color: #1a1a1a; }
        @keyframes kFadeIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        .kanban-stats-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .kanban-stat {
          display: flex; align-items: center; gap: 8px;
          background: #ffffff; border: 1px solid #eeeee9;
          border-radius: 10px; padding: 8px 14px;
        }
        .kanban-stat .ks-num { font-family: 'Sora'; font-size: 20px; font-weight: 700; }
        .kanban-stat .ks-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
        .kanban-progress-bar {
          height: 4px; border-radius: 2px; background: #eeeee9;
          overflow: hidden; margin-bottom: 16px;
        }
        .kanban-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
          Workflow Board
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>Drag cards between columns or click to move · Each card = 1 event × 1 page</p>
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
        <span style={{ fontSize: 10, fontWeight: 600, color: "#d1d5db", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px" }}>Show</span>
        {[
          { v: "thisweek", l: "This Week" }, { v: "upcoming", l: "Next 45 Days" },
          { v: "overdue", l: "⚠ Overdue" }, { v: "all", l: "All Year" },
        ].map(f => <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)}>{f.l}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#d1d5db", letterSpacing: 1, textTransform: "uppercase", padding: "5px 2px" }}>Page</span>
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
                          <span style={{ fontSize: 9, color: "#d1d5db", background: "#f8f8f6", padding: "2px 6px", borderRadius: 4 }}>
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

// ═══════════════════════════════════════════
// AD REQUESTS VIEW
// ═══════════════════════════════════════════
function AdRequestsView({ data, addAdRequest, updateAdRequest, deleteAdRequest }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ eventName: "", pages: [], budget: "", startDate: "", endDate: "", brief: "", requestedBy: "" });
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredAds = statusFilter === "All" ? data.adRequests : data.adRequests.filter(a => a.status === statusFilter);
  const totalBudget = data.adRequests.reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);
  const liveBudget = data.adRequests.filter(a => a.status === "live" || a.status === "approved").reduce((s, a) => s + (parseFloat(a.budget) || 0), 0);

  const handleSubmit = () => {
    if (!form.eventName || form.pages.length === 0 || !form.budget) return;
    addAdRequest(form);
    setForm({ eventName: "", pages: [], budget: "", startDate: "", endDate: "", brief: "", requestedBy: "" });
    setShowForm(false);
  };

  const togglePage = (pid) => {
    setForm(f => ({ ...f, pages: f.pages.includes(pid) ? f.pages.filter(p => p !== pid) : [...f.pages, pid] }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
            Ad Budget & Requests
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Venue team submits ad requests → Creative team builds & runs</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700,
        }}>+ New Ad Request</button>
      </div>

      {/* Budget Overview */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { label: "Total Requests", val: data.adRequests.length, color: "#C9A84C" },
          { label: "Total Budget", val: `₹${totalBudget.toLocaleString("en-IN")}`, color: "#FFB300" },
          { label: "Active/Approved", val: `₹${liveBudget.toLocaleString("en-IN")}`, color: "#66BB6A" },
        ].map(s => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Sora'", fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>{s.label}</span>
          </div>
        ))}
        {/* Per-page budget breakdown */}
        {PAGES.filter(p => !p.noAds).map(pg => {
          const pageBudget = data.adRequests.filter(a => a.pages?.includes(pg.id)).reduce((s,a) => s + (parseFloat(a.budget) || 0) / (a.pages?.length || 1), 0);
          return pageBudget > 0 ? (
            <div key={pg.id} style={{ background: "#ffffff", border: "1px solid #eeeee9", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pg.color }} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>{pg.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pg.color }}>₹{Math.round(pageBudget).toLocaleString("en-IN")}</span>
            </div>
          ) : null;
        })}
      </div>

      {/* NEW REQUEST FORM */}
      {showForm && (
        <div style={{ background: "#f8f8f6", border: "1px solid #e5e5e0", borderRadius: 14, padding: 24, marginBottom: 20, animation: "fadeSlide 0.2s ease" }}>
          <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ fontSize: 16, fontFamily: "'Sora'", fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>New Ad Request</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <InputField label="Event / Campaign Name" value={form.eventName} onChange={v => setForm(f => ({...f, eventName: v}))} placeholder="e.g. Diwali Night 2026" />
            <InputField label="Budget (₹)" value={form.budget} onChange={v => setForm(f => ({...f, budget: v}))} placeholder="e.g. 25000" type="number" />
            <InputField label="Ad Start Date" value={form.startDate} onChange={v => setForm(f => ({...f, startDate: v}))} type="date" />
            <InputField label="Ad End Date" value={form.endDate} onChange={v => setForm(f => ({...f, endDate: v}))} type="date" />
            <InputField label="Requested By" value={form.requestedBy} onChange={v => setForm(f => ({...f, requestedBy: v}))} placeholder="e.g. Venue Manager name" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Run Ad On Pages</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PAGES.filter(p => !p.noAds).map(pg => (
                <button key={pg.id} onClick={() => togglePage(pg.id)} style={{
                  padding: "6px 14px", borderRadius: 8, border: `1px solid ${form.pages.includes(pg.id) ? pg.color : "#e5e5e0"}`,
                  background: form.pages.includes(pg.id) ? `${pg.color}20` : "#ffffff",
                  color: form.pages.includes(pg.id) ? pg.color : "#6b7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>{pg.name}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Brief / Notes</div>
            <textarea value={form.brief} onChange={e => setForm(f => ({...f, brief: e.target.value}))} placeholder="Describe the ad content, target audience, key message..." style={{
              width: "100%", minHeight: 80, background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, padding: 12, color: "#1a1a1a", fontSize: 13, resize: "vertical",
            }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSubmit} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1a1a1a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Submit Request</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e5e0", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <Chip active={statusFilter === "All"} onClick={() => setStatusFilter("All")}>All</Chip>
        {Object.entries(AD_REQUEST_STATUS).map(([k,v]) => <Chip key={k} active={statusFilter === k} onClick={() => setStatusFilter(k)}>{v.label}</Chip>)}
      </div>

      {/* Requests List */}
      {filteredAds.length === 0 && <EmptyState msg="No ad requests yet. Click '+ New Ad Request' to create one." />}
      {[...filteredAds].reverse().map(req => {
        const stInfo = AD_REQUEST_STATUS[req.status] || AD_REQUEST_STATUS.requested;
        return (
          <div key={req.id} style={{
            background: "#ffffff", border: "1px solid #eeeee9",
            borderRadius: 12, padding: "16px 20px", marginBottom: 8,
            borderLeft: `3px solid ${stInfo.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Sora'", fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{req.eventName}</span>
                  <select
                    value={req.status}
                    onChange={(e) => updateAdRequest(req.id, { status: e.target.value })}
                    style={{ fontSize: 10, background: stInfo.bg, color: stInfo.color, border: `1px solid ${stInfo.color}30`, borderRadius: 5, padding: "2px 8px", cursor: "pointer", fontWeight: 700 }}
                  >
                    {Object.entries(AD_REQUEST_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                  <span>💰 <strong style={{ color: "#FFB300" }}>₹{parseFloat(req.budget).toLocaleString("en-IN")}</strong></span>
                  {req.startDate && <span>📅 {formatDate(req.startDate)} → {req.endDate ? formatDate(req.endDate) : "TBD"}</span>}
                  {req.requestedBy && <span>👤 {req.requestedBy}</span>}
                  <span style={{ color: "#d1d5db" }}>Created {new Date(req.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: req.brief ? 8 : 0 }}>
                  {(req.pages || []).map(pid => {
                    const pg = PAGES.find(p => p.id === pid);
                    return pg ? <span key={pid} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: `${pg.color}18`, color: pg.color, fontWeight: 600 }}>{pg.name}</span> : null;
                  })}
                </div>
                {req.brief && <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, background: "#f8f8f6", padding: "8px 12px", borderRadius: 8 }}>{req.brief}</div>}
              </div>
              <button onClick={() => { if(confirm("Delete this ad request?")) deleteAdRequest(req.id); }} style={{ background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 6, padding: "4px 10px", color: "#EF5350", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// PAGES VIEW
// ═══════════════════════════════════════════
function PagesView({ allEvents }) {
  return (
    <div>
      <h1 style={{ fontFamily: "'Sora'", fontSize: 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
        Ambria Instagram Pages
      </h1>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>All 8 pages at a glance — click to open on Instagram</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {PAGES.map(pg => (
          <a key={pg.id} href={pg.url} target="_blank" rel="noopener noreferrer" style={{
            textDecoration: "none", background: "#ffffff", border: "1px solid #eeeee9",
            borderRadius: 14, padding: 20, transition: "all 0.25s", display: "block",
            borderLeft: `4px solid ${pg.color}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f5f4f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${pg.color}25`, border: `2px solid ${pg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: pg.color, fontFamily: "'Sora'" }}>
                {pg.name.charAt(pg.name.indexOf(" ") + 1 || 0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "'Sora'", fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{pg.name}</div>
                <div style={{ fontSize: 12, color: pg.color }}>{pg.handle}</div>
              </div>
              {pg.noAds && <span style={{ marginLeft: "auto", fontSize: 10, background: "#f3f2ef", padding: "2px 8px", borderRadius: 5, color: "#9ca3af" }}>No Ads</span>}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{pg.desc}</div>
            {/* Events count */}
            <div style={{ marginTop: 10, fontSize: 11, color: "#d1d5db" }}>
              📅 {allEvents.filter(e => (e.pages || []).includes(pg.id)).length} calendar events assigned
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? "#1a1a1a" : "#e5e5e0"}`,
      background: active ? "rgba(26,26,26,0.08)" : "#ffffff",
      color: active ? "#1a1a1a" : "#9ca3af",
      fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0",
        borderRadius: 10, color: "#1a1a1a", fontSize: 13,
      }} />
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#d1d5db" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
