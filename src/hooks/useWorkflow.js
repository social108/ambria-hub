import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient.js";

export default function useWorkflow({ onSyncError } = {}) {
  const [workflowData, setWorkflowData] = useState({});
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const retryTimer = useRef(null);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from("workflow_status").select("*");
    if (error) {
      console.error("useWorkflow fetch error:", error);
      if (retryCount.current < 3) {
        retryCount.current++;
        onSyncError?.("Sync error — retrying...");
        retryTimer.current = setTimeout(fetchData, 5000);
        return;
      }
      onSyncError?.("Sync failed after retries");
      setLoading(false);
      return;
    }

    retryCount.current = 0;

    // Convert rows to nested object: { [event_key]: { [page_id]: { status } } }
    const nested = {};
    (data || []).forEach(row => {
      if (!nested[row.event_key]) nested[row.event_key] = {};
      nested[row.event_key][row.page_id] = { status: row.status };
    });
    setWorkflowData(nested);
    setLoading(false);
  }, [onSyncError]);

  useEffect(() => {
    fetchData();
    return () => clearTimeout(retryTimer.current);
  }, [fetchData]);

  const updateWorkflow = useCallback(async (eventKey, pageId, field, value) => {
    // Optimistic local update
    setWorkflowData(prev => {
      const wf = { ...prev };
      if (!wf[eventKey]) wf[eventKey] = {};
      if (!wf[eventKey][pageId]) wf[eventKey][pageId] = {};
      wf[eventKey][pageId][field] = value;
      return wf;
    });

    const { error } = await supabase.from("workflow_status").upsert(
      { event_key: eventKey, page_id: pageId, status: value },
      { onConflict: "event_key,page_id" }
    );
    if (error) { console.error("updateWorkflow error:", error); onSyncError?.("Sync error — retrying..."); }
  }, [onSyncError]);

  return { workflowData, updateWorkflow, loading, refetch: fetchData };
}
