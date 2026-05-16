import { LayoutDashboard, Container, FileText, Ship, Building2, Bell, Settings, BookOpen, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/shared/auth/AuthProvider";

const ALL: AppRole[] = ["viewer", "coordinator", "admin"];
const baseNav: { icon: typeof LayoutDashboard; label: string; to: string; roles: AppRole[] }[] = [
  { icon: LayoutDashboard, label: "Command Center", to: "/", roles: ALL },
  { icon: Container, label: "Shipping Center", to: "/containers", roles: ALL },
  { icon: Ship, label: "Vessels & ETAs", to: "#", roles: ALL },
  { icon: FileText, label: "Phyto Certificates", to: "#", roles: ALL },
  { icon: Building2, label: "Facilities", to: "#", roles: ALL },
  { icon: Bell, label: "Alerts", to: "/alerts", roles: ALL },
  { icon: Settings, label: "Settings", to: "/settings", roles: ["admin"] },
];

const facilities = [
  { name: "Salida", count: 14 },
  { name: "Modesto", count: 11 },
  { name: "Firebaugh", count: 9 },
  { name: "Chowchilla", count: 6 },
];

export const Sidebar = () => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const nav = baseNav.filter((n) => !role || n.roles.includes(role));
  const displayName = profile?.display_name ?? "User";
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <Ship className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">NOMOS</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Export Command</div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-border">
        <div className="px-2 py-1.5 rounded-md bg-secondary flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Org</div>
            <div className="text-sm font-semibold text-foreground">Capay Canyon Ranch</div>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          const isLive = item.to !== "#";
          if (!isLive) {
            return (
              <button
                key={item.label}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-foreground/80 hover:bg-secondary"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          }
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}

        <div className="pt-5 pb-1 px-2.5 text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          Facilities
        </div>
        {facilities.map((f) => (
          <button key={f.name} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {f.name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">{f.count}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-1">
        <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary">
          <BookOpen className="w-4 h-4" /> Compliance docs
        </button>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-secondary">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            {initials || "?"}
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{displayName}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{role ?? "—"}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
};
