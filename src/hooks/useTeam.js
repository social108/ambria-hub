import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseUserCreation } from "../supabaseClient.js";

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

  const inviteMember = useCallback(async ({ fullName, email, password, role }) => {
    // Sign up using the separate client so admin's session is untouched
    const { data: signUpData, error: signUpErr } = await supabaseUserCreation.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpErr) throw signUpErr;

    const newUserId = signUpData.user?.id;
    if (!newUserId) throw new Error("User creation failed — no user ID returned");

    // Upsert the profile with role and metadata
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        id: newUserId,
        full_name: fullName,
        email,
        role,
        status: "invited",
      }, { onConflict: "id" });
    if (profileErr) throw profileErr;

    // Sign out the new user from the creation client (cleanup)
    await supabaseUserCreation.auth.signOut();

    // Refresh the member list
    await fetchMembers();
    return signUpData.user;
  }, [fetchMembers]);

  const updateMemberRole = useCallback(async (userId, newRole) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (err) throw err;
    await fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, fetchMembers, inviteMember, updateMemberRole };
}
