import { PAGES } from "../lib/constants.js";

export default function PagesView({ allEvents }) {
  return (
    <div>
      <h1 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg,#fff 30%,#BA68C8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
        Ambria Instagram Pages
      </h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>All 8 pages at a glance — click to open on Instagram</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {PAGES.map(pg => (
          <a key={pg.id} href={pg.url} target="_blank" rel="noopener noreferrer" style={{
            textDecoration: "none", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: 20, transition: "all 0.25s", display: "block",
            borderLeft: `4px solid ${pg.color}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${pg.color}25`, border: `2px solid ${pg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: pg.color, fontFamily: "'Outfit'" }}>
                {pg.name.charAt(pg.name.indexOf(" ") + 1 || 0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit'", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{pg.name}</div>
                <div style={{ fontSize: 12, color: pg.color }}>{pg.handle}</div>
              </div>
              {pg.noAds && <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 5, color: "rgba(255,255,255,0.35)" }}>No Ads</span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{pg.desc}</div>
            {/* Events count */}
            <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              📅 {allEvents.filter(e => (e.pages || []).includes(pg.id)).length} calendar events assigned
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
