import { PAGES } from "../lib/constants.js";

export default function PagesView({ allEvents }) {
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
            borderLeft: `4px solid ${pg.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
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
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{pg.desc}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: "#d1d5db" }}>
              📅 {allEvents.filter(e => (e.pages || []).includes(pg.id)).length} calendar events assigned
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
