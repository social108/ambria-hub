import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient.js";

const AuthContext = createContext(null);

// Department is the source of truth. Role is derived from it for the
// existing role-based permission checks inside views.
function deriveRole(department, fallbackRole) {
  if (department === "admin") return "admin";
  if (department === "creative") return "creative";
  if (["venue", "catering", "decor", "entertainment"].includes(department)) return "venue_manager";
  return fallbackRole || "viewer";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // The profiles query can transiently fail right after sign-in (the fresh
  // session's JWT hasn't always propagated to PostgREST/RLS yet), which would
  // otherwise read as "no profile" and flash Access Denied before a retry
  // corrects it. Retry a few times before accepting that as the real answer.
  const fetchProfile = useCallback(async (userId) => {
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, department, team_members")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setDepartment(data.department || null);
        setRole(deriveRole(data.department, data.role));
        setTeamMembers(Array.isArray(data.team_members) ? data.team_members : []);
        return;
      }
      lastError = error;
      if (attempt < 3) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    }
    console.error("fetchProfile failed after retries:", lastError);
    setDepartment(null);
    setRole(null);
    setTeamMembers([]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Department isn't known yet for this new session — show the
        // loading screen instead of flashing Access Denied while it fetches.
        setLoading(true);
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setRole(null);
        setDepartment(null);
        setTeamMembers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, role, department, teamMembers, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
