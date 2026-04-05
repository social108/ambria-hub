import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

export default function useWorkflow() {
  const [workflowData, setWorkflowData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from("workflow_status").select("*");
    if (error) { console.error("useWorkflow fetch error:", error); setLoading(false); return; }

    // Convert rows to nested object: { [event_key]: { [page_id]: { status } } }
    const nested = {};
    (data || []).forEach(row => {
      if (!nested[row.event_key]) nested[row.event_key] = {};
      nested[row.event_key][row.page_id] = { status: row.status };
    });
    setWorkflowData(nested);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    if (error) { console.error("updateWorkflow error:", error); }
  }, []);

  return { workflowData, updateWorkflow, loading, refetch: fetchData };
}
