import { API_CAMPAIGN_TARGETS, ACTION_TYPES } from "../../lib/constants.js";
import FieldLabel from "./FieldLabel.jsx";
import FieldError from "./FieldError.jsx";

const ACCENT = ACTION_TYPES.api_campaign.color;

// Sub-picker revealed under Actions once "API Campaign" is selected. Rendered
// by both the calendar modal and the reminders edit modal, so it lives here.
export default function ApiCampaignPicker({ selected = [], onToggle, onSetAll, error }) {
  const allIds = API_CAMPAIGN_TARGETS.map(t => t.id);
  const allSel = allIds.every(id => selected.includes(id));

  return (
    <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <FieldLabel>{ACTION_TYPES.api_campaign.icon} API Campaign — Send To</FieldLabel>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button onClick={() => onSetAll(allSel ? [] : allIds)} style={{
          padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
          border: allSel ? `1px solid ${ACCENT}` : "1px solid #e5e5e0",
          background: allSel ? ACCENT : "#ffffff",
          color: allSel ? "#ffffff" : "#9ca3af",
        }}>All</button>
        {API_CAMPAIGN_TARGETS.map(t => (
          <button key={t.id} onClick={() => onToggle(t.id)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            border: `1px solid ${selected.includes(t.id) ? ACCENT : "#e5e5e0"}`,
            background: selected.includes(t.id) ? `${ACCENT}18` : "#ffffff",
            color: selected.includes(t.id) ? ACCENT : "#9ca3af",
          }}>{t.name}</button>
        ))}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
