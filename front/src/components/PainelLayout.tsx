import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, Users, UserCheck, UserCog, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
  { to: "/painel/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/painel/admin/lideres", label: "Líderes", icon: UserCheck, end: false },
  { to: "/painel/admin/apoiadores", label: "Apoiadores", icon: Users, end: false },
  { to: "/painel/perfil", label: "Perfil", icon: UserCog, end: false },
];

const LIDER_NAV = [
  { to: "/painel/lider", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/painel/perfil", label: "Perfil", icon: UserCog, end: false },
];

export function PainelLayout() {
  const { user, logout } = useAuth();
  const navItems = user?.role === "admin" ? ADMIN_NAV : LIDER_NAV;
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b border-linha px-4">
        <span className="font-display text-sm font-bold text-rosa tracking-wide uppercase">Painel</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-tinta-suave hover:bg-rosa-tenue hover:text-tinta transition-colors"
            activeClassName="bg-rosa-tenue text-rosa font-semibold"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Desktop sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-col border-r border-linha bg-azul-fundo shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-linha bg-azul-fundo
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-14 items-center justify-between border-b border-linha px-4">
          <span className="font-display text-sm font-bold text-rosa tracking-wide uppercase">Painel</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-tinta-suave hover:text-tinta transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-tinta-suave hover:bg-rosa-tenue hover:text-tinta transition-colors"
              activeClassName="bg-rosa-tenue text-rosa font-semibold"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-linha bg-papel px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-tinta-suave hover:text-tinta transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-body text-sm text-tinta-suave">
              Olá,{" "}
              <span className="font-semibold text-tinta">{user?.name}</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            className="gap-2 text-tinta-suave hover:text-tinta hover:bg-rosa-tenue"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
