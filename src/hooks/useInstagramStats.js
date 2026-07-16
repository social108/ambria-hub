import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

// Fetches live follower/engagement/view stats for one page via the
// instagram-stats Edge Function (see supabase/functions/instagram-stats).
// Returns stats.connected === false with a human-readable `reason` until
// that page has been linked to a real Instagram Business Account ID.
export default function useInstagramStats(pageId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("instagram-stats", {
      body: { pageId },
    });
    if (fnError) {
      setError(fnError.message || "Failed to load Instagram stats");
      setStats(null);
    } else {
      setStats(data);
    }
    setLoading(false);
  }, [pageId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
