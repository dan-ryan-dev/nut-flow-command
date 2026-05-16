import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "coordinator" | "viewer";

type Profile = { user_id: string; org_id: string | null; display_name: string | null };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: { org_id: string; role: AppRole }[];
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const useAuth = () => useContext(Ctx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<{ org_id: string; role: AppRole }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe BEFORE getSession
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) {
        setProfile(null);
        setRoles([]);
      } else {
        // defer DB calls to avoid recursive locking
        setTimeout(() => loadUserData(s.user!.id), 0);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadUserData(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("user_id, org_id, display_name").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("org_id, role").eq("user_id", uid),
    ]);
    setProfile(p as Profile | null);
    setRoles((r ?? []) as { org_id: string; role: AppRole }[]);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  // Highest-privilege role across orgs
  const rank: Record<AppRole, number> = { viewer: 0, coordinator: 1, admin: 2 };
  const role = roles.length
    ? roles.reduce((acc, r) => (rank[r.role] > rank[acc] ? r.role : acc), "viewer" as AppRole)
    : null;

  return (
    <Ctx.Provider value={{ user, session, profile, roles, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};