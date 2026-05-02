import { getAdWorkflowSummary } from "../../lib/helpers.js";

// Reads workflowData for `ad-${reqId}` and renders a status badge,
// progress bar, and breakdown line. Used on Ad Requests cards in both
// the admin/creative view and the simplified DepartmentView.
export default function AdWorkflowProgress({ adRequestId, workflowData }) {
  const summary = getAdWorkflowSummary(adRequestId, workflowData);
  const { total, done, counts } = summary;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <div style={{ marginTop: 8 }}>
      <span style={{
        display: "inline-block",
        padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: allDone ? "#dcfce7" : "#dbeafe",
        color: allDone ? "#16a34a" : "#2563eb",
      }}>
        {allDone ? "✅ Completed" : "✅ Approved"}
      </span>

      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f3f2ef", overflow: "hidden" }}>
          <div style={{
            width: `${percent}%`, height: "100%", borderRadius: 3,
            background: allDone ? "#22c55e" : "#3b82f6",
            transition: "width 0.3s ease",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
          {done}/{total} done
        </span>
      </div>

      {total === 0 && (
        <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
          No workflow cards yet — approve will create them.
        </div>
      )}

      {total > 0 && allDone && (
        <div style={{ marginTop: 4, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
          All {total} page{total === 1 ? "" : "s"} done ✓
        </div>
      )}

      {total > 0 && !allDone && (
        <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
          {[
            counts.creative_wip > 0 && `✎ ${counts.creative_wip} WIP`,
            counts.ready > 0 && `✓ ${counts.ready} Ready`,
            counts.posted > 0 && `◎ ${counts.posted} Posted`,
            counts.ad_live > 0 && `▲ ${counts.ad_live} Live`,
            counts.completed > 0 && `★ ${counts.completed} Done`,
            counts.skipped > 0 && `✕ ${counts.skipped} Skipped`,
            counts.pending > 0 && `○ ${counts.pending} Pending`,
          ].filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}
