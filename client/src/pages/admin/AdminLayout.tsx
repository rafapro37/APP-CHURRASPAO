import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Flame, UtensilsCrossed, ListOrdered, Ticket, Wallet, Users, LogOut, BrainCircuit, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { clearAccess } from "@/lib/accessControl";

const ADMIN_MENU = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/pedidos", label: "Pedidos", icon: Flame },
  { path: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { path: "/admin/categorias", label: "Categorias", icon: ListOrdered },
  { path: "/admin/promocoes", label: "Promocoes", icon: Ticket },
  { path: "/admin/cupons", label: "Cupons", icon: Wallet },
  { path: "/admin/clientes", label: "Clientes", icon: Users },
  { path: "/admin/gestao", label: "Gestao", icon: BrainCircuit },
];

function AdminMenu({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className={`flex flex-col gap-2 ${compact ? "px-4 py-4" : "px-2 py-2"}`}>
      {ADMIN_MENU.map((item) => {
        const isActive = item.path === "/admin" ? location === "/admin" : location.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            href={item.path}
            title={item.label}
            onClick={onNavigate}
            className={`flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors ${compact ? "justify-start" : "justify-start md:h-auto md:rounded-lg md:px-3 md:py-2"} ${isActive ? "bg-brand text-white" : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
          >
            <Icon className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  const logo = getBrandLogo();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-card md:block">
        <div className="flex items-center gap-3 px-4 py-4">
          <img src={logo} alt="CHURRASPAO E CIA" className="h-11 w-11 shrink-0 rounded-full object-contain ring-2 ring-brand/40 md:h-10 md:w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight">{BRAND.name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-bright">Painel admin</p>
          </div>
        </div>
        <AdminMenu />
      </aside>

      <div className={`fixed inset-0 z-40 md:hidden ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Fechar menu"
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside className={`relative flex h-full w-[82vw] max-w-80 flex-col overflow-y-auto border-r border-border bg-[#111] text-white shadow-2xl shadow-black/70 transition-transform duration-200 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
              <img src={logo} alt="CHURRASPAO E CIA" className="h-14 w-14 shrink-0 rounded-full object-contain ring-2 ring-brand/40" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold leading-tight">{BRAND.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-bright">Painel admin</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:border-brand"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminMenu compact onNavigate={() => setDrawerOpen(false)} />
          </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-3 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold md:text-lg">{title ?? "Painel Administrativo"}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0 md:w-auto md:px-3">
                  <Avatar className="h-8 w-8 border border-brand/40">
                    <AvatarFallback className="text-xs font-medium">R</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-medium md:inline">Rafael</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => {
                    clearAccess("admin");
                    window.location.href = "/admin";
                  }}
                  className="cursor-pointer text-muted-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-3 pb-8 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminForbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-8">
      <p className="font-display text-xl font-bold">Acesso restrito</p>
      <p className="text-center text-sm text-muted-foreground">Esta area e exclusiva dos administradores do CHURRASPAO E CIA.</p>
      <Link href="/" className="font-semibold text-brand-bright hover:underline">Voltar ao app</Link>
    </div>
  );
}
