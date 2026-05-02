import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient.js";

export default function useWorkflow({ onSyncError } = {}) {
  const [workflowData, setWorkflowData] = useState({});
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const retryTimer = useRef(null);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from("workflow_status")
      .select("event_key, page_id, status, budget");
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

    // Convert rows to nested object: { [event_key]: { [page_id]: { status, budget } } }
    const nested = {};
    (data || []).forEach(row => {
      if (!nested[row.event_key]) nested[row.event_key] = {};
      nested[row.event_key][row.page_id] = {
        status: row.status,
        budget: parseFloat(row.budget) || 0,
      };
    });
    setWorkflowData(nested);
    setLoading(false);
  }, [onSyncError]);

  useEffect(() => {
    fetchData();
    return () => clearTimeout(retryTimer.current);
  }, [fetchData]);

  // Helpers — separate update vs insert paths so a status change never
  // touches budget and vice versa. No upsert anywhere.
  const updateRow = useCallback(async (eventKey, pageId, patch) => {
    return supabase
      .from("workflow_status")
      .update(patch)
      .eq("event_key", eventKey)
      .eq("page_id", pageId);
  }, []);

  const insertRow = useCallback(async (eventKey, pageId, fields) => {
    return supabase
      .from("workflow_status")
      .insert({ event_key: eventKey, page_id: pageId, budget: 0, ...fields });
  }, []);

  const rowExists = useCallback(async (eventKey, pageId) => {
    const { data } = await supabase
      .from("workflow_status")
      .select("id")
      .eq("event_key", eventKey)
      .eq("page_id", pageId)
      .maybeSingle();
    return !!data;
  }, []);

  const updateWorkflow = useCallback(async (eventKey, pageId, field, value) => {
    // Optimistic local update — preserve any other fields on the page.
    setWorkflowData(prev => {
      const wf = { ...prev };
      wf[eventKey] = { ...(prev[eventKey] || {}) };
      wf[eventKey][pageId] = { ...(wf[eventKey][pageId] || {}), [field]: value };
      return wf;
    });

    let error;
    if (field === "budget") {
      // Budget input is only shown once status is set, so the row exists.
      // UPDATE only — never touch status.
      const num = parseFloat(value) || 0;
      ({ error } = await updateRow(eventKey, pageId, { budget: num }));
    } else if (field === "status") {
      const exists = await rowExists(eventKey, pageId);
      if (exists) {
        ({ error } = await updateRow(eventKey, pageId, { status: value }));
      } else {
        ({ error } = await insertRow(eventKey, pageId, { status: value }));
      }
    } else {
      ({ error } = await updateRow(eventKey, pageId, { [field]: value }));
    }
    if (error) {
      console.error("updateWorkflow error:", { eventKey, pageId, field, value, error });
      onSyncError?.("Sync error — retrying...");
    }
  }, [onSyncError, updateRow, insertRow, rowExists]);

  // Update status for ALL pages of an event at once. For each page we either
  // UPDATE (existing row — budget preserved) or INSERT (new row — budget=0).
  const updateWorkflowEvent = useCallback(async (eventKey, pageIds, status) => {
    // Optimistic local update — preserve existing per-page fields (budget).
    setWorkflowData(prev => {
      const wf = { ...prev };
      wf[eventKey] = { ...(prev[eventKey] || {}) };
      pageIds.forEach(pid => {
        wf[eventKey][pid] = { ...(wf[eventKey][pid] || {}), status };
      });
      return wf;
    });

    // Find which pages already have rows
    const { data: existing, error: selErr } = await supabase
      .from("workflow_status")
      .select("page_id")
      .eq("event_key", eventKey)
      .in("page_id", pageIds);
    if (selErr) {
      console.error("updateWorkflowEvent select error:", selErr);
      onSyncError?.("Sync error — retrying...");
      return;
    }
    const have = new Set((existing || []).map(r => r.page_id));
    const toUpdate = pageIds.filter(p => have.has(p));
    const toInsert = pageIds.filter(p => !have.has(p));

    if (toUpdate.length > 0) {
      const { error } = await supabase
        .from("workflow_status")
        .update({ status })
        .eq("event_key", eventKey)
        .in("page_id", toUpdate);
      if (error) {
        console.error("updateWorkflowEvent update error:", error);
        onSyncError?.("Sync error — retrying...");
      }
    }
    if (toInsert.length > 0) {
      const rows = toInsert.map(pid => ({ event_key: eventKey, page_id: pid, status, budget: 0 }));
      const { error } = await supabase.from("workflow_status").insert(rows);
      if (error) {
        console.error("updateWorkflowEvent insert error:", error);
        onSyncError?.("Sync error — retrying...");
      }
    }
  }, [onSyncError]);

  return { workflowData, updateWorkflow, updateWorkflowEvent, loading, refetch: fetchData };
}
