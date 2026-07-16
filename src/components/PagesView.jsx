import { useState } from "react";
import { PAGES } from "../lib/constants.js";
import { supabase } from "../supabaseClient.js";
import useIsMobile from "../hooks/useIsMobile.js";
import useInstagramStats from "../hooks/useInstagramStats.js";

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatBlock({ stats, loading }) {
  if (loading) {
    return <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 10 }}>Loading Instagram stats…</div>;
  }
  if (!stats?.connected) {
    return (
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 10, fontStyle: "italic" }}>
        📊 Not connected — {stats?.reason || "no Instagram account linked"}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0efec" }}>
      <div>
        <div style={{ fontFamily: "'Sora'", fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{formatCount(stats.followers)}</div>
        <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>Followers</div>
      </div>
      <div>
        <div style={{ fontFamily: "'Sora'", fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{stats.engagementRate}%</div>
        <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>Engagement</div>
      </div>
      <div>
        <div style={{ fontFamily: "'Sora'", fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{formatCount(stats.recentViews)}</div>
        <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>Views (last {stats.sampledPosts})</div>
      </div>
    </div>
  );
}

function ConnectModal({ page, currentId, onClose, onSaved, mob }) {
  const [igId, setIgId] = useState(currentId || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!igId.trim()) { setError("Instagram Business Account ID is required"); return; }
    setSaving(true);
    setError("");
    const { error: upsertError } = await supabase
      .from("instagram_accounts")
      .upsert({ page_id: page.id, ig_business_id: igId.trim(), updated_at: new Date().toISOString() }, { onConflict: "page_id" });
    setSaving(false);
    if (upsertError) { setError(upsertError.message); return; }
    onSaved();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, padding: mob ? 20 : 26, boxShadow: "0 24px 48px rgba(0,0,0,0.12)" }}>
        <h3 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>Connect {page.name}</h3>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#9ca3af" }}>
          Paste the Instagram Business Account ID for this page (from the Meta Graph API Explorer).
        </p>
        <input
          value={igId}
          onChange={e => setIgId(e.target.value)}
          placeholder="e.g. 17841400000000000"
          autoFocus
          style={{ width: "100%", padding: "9px 12px", background: "#f5f4f1", border: "1px solid #e5e5e0", borderRadius: 10, color: "#1a1a1a", fontSize: 13, boxSizing: "border-box" }}
        />
        {error && <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626" }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e5e0", background: "#f5f4f1", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saving ? "#9ca3af" : "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PageCard({ pg, eventCount, isAdmin, mob }) {
  const { stats, loading, refetch } = useInstagramStats(pg.id);
  const [connecting, setConnecting] = useState(false);

  return (
    <div style={{
      background: "#ffffff", border: "1px solid #eeeee9",
      borderRadius: 14, padding: mob ? 14 : 20, transition: "all 0.25s",
      borderLeft: `4px solid ${pg.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${pg.color}25`, border: `2px solid ${pg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: pg.color, fontFamily: "'Sora'", flexShrink: 0 }}>
          {pg.name.charAt(pg.name.indexOf(" ") + 1 || 0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Sora'", fontSize: mob ? 14 : 15, fontWeight: 700, color: "#1a1a1a" }}>{pg.name}</div>
          <div style={{ fontSize: 12, color: pg.color }}>{pg.handle}</div>
        </div>
        {pg.noAds && <span style={{ marginLeft: "auto", fontSize: 10, background: "#f3f2ef", padding: "2px 8px", borderRadius: 5, color: "#9ca3af", flexShrink: 0 }}>No Ads</span>}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{pg.desc}</div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#d1d5db" }}>
        📅 {eventCount} calendar events assigned
      </div>

      <StatBlock stats={stats} loading={loading} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
        <a href={pg.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: pg.color, textDecoration: "none" }}>
          Open Instagram ↗
        </a>
        {isAdmin && (
          <button
            onClick={() => setConnecting(true)}
            style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#9ca3af", background: "none", border: "1px solid #e5e5e0", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}
          >
            {stats?.connected ? "🔗 Reconfigure" : "🔗 Connect"}
          </button>
        )}
      </div>

      {connecting && (
        <ConnectModal
          page={pg}
          currentId={stats?.igBusinessId || ""}
          onClose={() => setConnecting(false)}
          onSaved={() => { setConnecting(false); refetch(); }}
          mob={mob}
        />
      )}
    </div>
  );
}

export default function PagesView({ allEvents, role }) {
  const mob = useIsMobile();
  const isAdmin = role === "admin";

  return (
    <div>
      <h1 style={{ fontFamily: "'Sora'", fontSize: mob ? 22 : 28, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
        Ambria Instagram Pages
      </h1>
      <p style={{ fontSize: mob ? 11 : 13, color: "#9ca3af", marginBottom: 20 }}>All 8 pages at a glance — followers, engagement & views pulled live from Instagram</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${mob ? "240px" : "300px"}, 1fr))`, gap: 12 }}>
        {PAGES.map(pg => (
          <PageCard
            key={pg.id}
            pg={pg}
            eventCount={allEvents.filter(e => (e.pages || []).includes(pg.id)).length}
            isAdmin={isAdmin}
            mob={mob}
          />
        ))}
      </div>
    </div>
  );
}
