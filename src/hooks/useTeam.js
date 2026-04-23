import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

export default function useTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, role, full_name, email, status, last_sign_in, created_at")
        .order("created_at", { ascending: true });
      if (err) throw err;
      setMembers(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const updateMemberRole = useCallback(async (userId, newRole) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (err) throw err;
    await fetchMembers();
  }, [fetchMembers]);

  const deleteMember = useCallback(async (userId) => {
    const { error: err } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (err) throw err;
    await fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, fetchMembers, updateMemberRole, deleteMember };
}
