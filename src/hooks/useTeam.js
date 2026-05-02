import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseSecondary } from "../supabaseClient.js";

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
        .select("id, role, department, team_members, full_name, email, status, last_sign_in, created_at")
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

  const updateMemberDepartment = useCallback(async (userId, newDept) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ department: newDept })
      .eq("id", userId);
    if (err) throw err;
    await fetchMembers();
  }, [fetchMembers]);

  // Create a new department account: signs up via the session-isolated client
  // so the admin's session is preserved, then upserts the profile row with
  // department + team_members.
  const createDepartmentAccount = useCallback(async ({ department, email, password, teamMembers }) => {
    const fullName = department.charAt(0).toUpperCase() + department.slice(1) + " Team";

    const { data, error: signErr } = await supabaseSecondary.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signErr) throw signErr;
    if (!data?.user) throw new Error("Sign up succeeded but no user returned");

    const { error: profErr } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        department,
        role: department,
        team_members: teamMembers || [],
      }, { onConflict: "id" });
    if (profErr) throw profErr;

    // Drop any session that signUp may have created on the secondary client.
    await supabaseSecondary.auth.signOut().catch(() => {});

    await fetchMembers();
    return data.user;
  }, [fetchMembers]);

  // Edit an existing department account (cannot change email / password from
  // the client). Updates department, team_members, and the derived full_name.
  const updateDepartmentProfile = useCallback(async (userId, { department, teamMembers }) => {
    const updates = {};
    if (department !== undefined) {
      updates.department = department;
      updates.role = department;
      updates.full_name = department.charAt(0).toUpperCase() + department.slice(1) + " Team";
    }
    if (teamMembers !== undefined) updates.team_members = teamMembers;
    const { error: err } = await supabase.from("profiles").update(updates).eq("id", userId);
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

  return {
    members,
    loading,
    error,
    fetchMembers,
    updateMemberDepartment,
    createDepartmentAccount,
    updateDepartmentProfile,
    deleteMember,
  };
}
