import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient.js";
import { EVENTS } from "../lib/events.js";

export default function useEvents() {
  const [customEvents, setCustomEvents] = useState([]);
  const [builtinOverrides, setBuiltinOverrides] = useState({}); // { [id]: { overrides, hidden } }
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [ceRes, boRes] = await Promise.all([
      supabase.from("custom_events").select("*").order("date", { ascending: true }),
      supabase.from("builtin_overrides").select("*"),
    ]);

    if (ceRes.data) {
      setCustomEvents(ceRes.data.map(row => ({
        id: row.id,
        name: row.name,
        date: row.date,
        cat: row.cat,
        actions: row.actions || [],
        pages: row.pages || [],
        priority: row.priority,
        adLeadDays: row.ad_lead_days,
        note: row.note,
        custom: true,
      })));
    }

    if (boRes.data) {
      const map = {};
      boRes.data.forEach(row => {
        map[row.id] = { overrides: row.overrides || {}, hidden: !!row.hidden };
      });
      setBuiltinOverrides(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Merge built-in EVENTS with overrides + custom events — same logic as original
  const allEvents = useMemo(() => {
    const builtIn = EVENTS
      .map(e => {
        const id = `builtin-${e.date}-${e.name}`;
        const bo = builtinOverrides[id];
        if (bo?.hidden) return null;
        const overrides = bo?.overrides || {};
        return { ...e, ...overrides, id, custom: false, edited: !!bo?.overrides && Object.keys(bo.overrides).length > 0 };
      })
      .filter(Boolean);
    const custom = customEvents.map(e => ({ ...e, custom: true }));
    return [...builtIn, ...custom].sort((a, b) => a.date.localeCompare(b.date));
  }, [customEvents, builtinOverrides]);

  const hiddenBuiltins = useMemo(() => {
    return Object.entries(builtinOverrides)
      .filter(([, v]) => v.hidden)
      .map(([id]) => id);
  }, [builtinOverrides]);

  const hiddenCount = hiddenBuiltins.length;

  const addEvent = useCallback(async (evt) => {
    const newId = crypto.randomUUID();
    const row = {
      id: newId,
      name: evt.name,
      date: evt.date,
      cat: evt.cat,
      actions: evt.actions || [],
      pages: evt.pages || [],
      priority: evt.priority ?? 2,
      ad_lead_days: evt.adLeadDays || 15,
      note: evt.note || "",
    };
    const { error } = await supabase.from("custom_events").insert(row);
    if (error) { console.error("addEvent error:", error); return; }
    setCustomEvents(prev => [...prev, {
      id: newId, name: evt.name, date: evt.date, cat: evt.cat,
      actions: evt.actions || [], pages: evt.pages || [],
      priority: evt.priority ?? 2, adLeadDays: evt.adLeadDays || 15,
      note: evt.note || "", custom: true,
    }]);
  }, []);

  const updateEvent = useCallback(async (id, updates, isBuiltin) => {
    if (isBuiltin) {
      // Get current overrides, merge
      const current = builtinOverrides[id]?.overrides || {};
      const merged = { ...current, ...updates };
      const { error } = await supabase.from("builtin_overrides").upsert({
        id,
        overrides: merged,
        hidden: builtinOverrides[id]?.hidden || false,
      });
      if (error) { console.error("updateEvent builtin error:", error); return; }
      setBuiltinOverrides(prev => ({
        ...prev,
        [id]: { ...prev[id], overrides: merged, hidden: prev[id]?.hidden || false },
      }));
    } else {
      const row = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.date !== undefined) row.date = updates.date;
      if (updates.cat !== undefined) row.cat = updates.cat;
      if (updates.actions !== undefined) row.actions = updates.actions;
      if (updates.pages !== undefined) row.pages = updates.pages;
      if (updates.priority !== undefined) row.priority = updates.priority;
      if (updates.adLeadDays !== undefined) row.ad_lead_days = updates.adLeadDays;
      if (updates.note !== undefined) row.note = updates.note;
      const { error } = await supabase.from("custom_events").update(row).eq("id", id);
      if (error) { console.error("updateEvent custom error:", error); return; }
      setCustomEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  }, [builtinOverrides]);

  const deleteEvent = useCallback(async (id, isBuiltin) => {
    if (isBuiltin) {
      const { error } = await supabase.from("builtin_overrides").upsert({
        id,
        overrides: builtinOverrides[id]?.overrides || {},
        hidden: true,
      });
      if (error) { console.error("deleteEvent builtin error:", error); return; }
      setBuiltinOverrides(prev => ({
        ...prev,
        [id]: { ...prev[id], overrides: prev[id]?.overrides || {}, hidden: true },
      }));
    } else {
      const { error } = await supabase.from("custom_events").delete().eq("id", id);
      if (error) { console.error("deleteEvent custom error:", error); return; }
      setCustomEvents(prev => prev.filter(e => e.id !== id));
    }
  }, [builtinOverrides]);

  const restoreBuiltin = useCallback(async (id) => {
    const { error } = await supabase.from("builtin_overrides").update({ hidden: false }).eq("id", id);
    if (error) { console.error("restoreBuiltin error:", error); return; }
    setBuiltinOverrides(prev => ({
      ...prev,
      [id]: { ...prev[id], hidden: false },
    }));
  }, []);

  const resetBuiltin = useCallback(async (id) => {
    const { error } = await supabase.from("builtin_overrides").delete().eq("id", id);
    if (error) { console.error("resetBuiltin error:", error); return; }
    setBuiltinOverrides(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return {
    allEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    restoreBuiltin,
    resetBuiltin,
    hiddenCount,
    hiddenBuiltins,
    loading,
    refetch: fetchData,
  };
}
