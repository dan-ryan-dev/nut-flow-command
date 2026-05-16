import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/shared/auth/AuthProvider";
import { Ship } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Check your email", { description: "Verify your address to finish signing up." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 shadow-elevated">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <Ship className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">NOMOS</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Export Command</div>
          </div>
        </div>

        <div className="flex border border-border rounded-md p-0.5 mb-5 bg-secondary">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-medium py-1.5 rounded ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === "signup" && (
            <div>
              <label className="text-xs text-muted-foreground">Display name</label>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Working…" : tab === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={google}
          className="w-full py-2 rounded-md border border-border text-sm font-medium hover:bg-secondary"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default AuthPage;