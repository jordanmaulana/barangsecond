import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useAtom } from "jotai";

import { userAtom } from "@/features/auth/state";
import { useLogout } from "@/features/auth/hooks";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Inventory", icon: Package },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/credits", label: "Credits", icon: CreditCard },
];

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

export function AppShell() {
  const [user] = useAtom(userAtom);
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-border bg-surface md:flex">
        <div className="flex flex-col gap-7 px-4 py-6">
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent font-display text-sm font-bold text-accent-foreground">
              b
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              barangsecond
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <div className="flex items-center justify-between">
            {user && (
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground">Signed in</div>
              </div>
            )}
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            barangsecond
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border text-muted-foreground hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface/95 backdrop-blur md:hidden">
          {NAV.map((item) => {
            const active = isActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
