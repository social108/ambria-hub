import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

export default function useAdRequests() {
  const [adRequests, setAdRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from("ad_requests")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) { console.error("useAdRequests fetch error:", error); setLoading(false); return; }

    setAdRequests((data || []).map(row => ({
      id: row.id,
      eventName: row.event_name,
      pages: row.pages || [],
      budget: row.budget,
      startDate: row.start_date,
      endDate: row.end_date,
      brief: row.brief,
      requestedBy: row.requested_by,
      status: row.status || "requested",
      createdAt: row.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addAdRequest = useCallback(async (req) => {
    const newId = crypto.randomUUID();
    const row = {
      id: newId,
      event_name: req.eventName,
      pages: req.pages || [],
      budget: parseFloat(req.budget) || 0,
      start_date: req.startDate || null,
      end_date: req.endDate || null,
      brief: req.brief || "",
      requested_by: req.requestedBy || "",
      status: "requested",
    };
    const { error } = await supabase.from("ad_requests").insert(row);
    if (error) { console.error("addAdRequest error:", error); return; }
    setAdRequests(prev => [...prev, {
      id: newId,
      eventName: req.eventName,
      pages: req.pages || [],
      budget: req.budget,
      startDate: req.startDate,
      endDate: req.endDate,
      brief: req.brief || "",
      requestedBy: req.requestedBy || "",
      status: "requested",
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const updateAdRequest = useCallback(async (id, updates) => {
    const row = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.eventName !== undefined) row.event_name = updates.eventName;
    if (updates.budget !== undefined) row.budget = updates.budget;
    if (updates.startDate !== undefined) row.start_date = updates.startDate || null;
    if (updates.endDate !== undefined) row.end_date = updates.endDate || null;
    if (updates.brief !== undefined) row.brief = updates.brief;
    if (updates.requestedBy !== undefined) row.requested_by = updates.requestedBy;
    if (updates.pages !== undefined) row.pages = updates.pages;
    const { error } = await supabase.from("ad_requests").update(row).eq("id", id);
    if (error) { console.error("updateAdRequest error:", error); return; }
    setAdRequests(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const deleteAdRequest = useCallback(async (id) => {
    const { error } = await supabase.from("ad_requests").delete().eq("id", id);
    if (error) { console.error("deleteAdRequest error:", error); return; }
    setAdRequests(prev => prev.filter(a => a.id !== id));
  }, []);

  return { adRequests, addAdRequest, updateAdRequest, deleteAdRequest, loading, refetch: fetchData };
}
