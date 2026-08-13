import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Flame, Home, Menu, Tag, Ticket, User, UtensilsCrossed, X } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/inicio", label: "Início", icon: Home },
  { path: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { path: "/cardapio", label: "Categorias", icon: Tag },
  { path: "/ofertas", label: "Promoções", icon: Ticket },
  { path: "/pedidos", label: "Meus pedidos", icon: Flame },
  { path: "/perfil", label: "Favoritos", icon: User },
  { path: "/perfil", label: "Minha conta", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-3 mb-3 grid grid-cols-5 rounded-2xl border border-border bg-card/95 px-1 py-1.5 shadow-2xl shadow-black/50 backdrop-blur">
        {NAV.slice(0, 5).map((item, index) => {
          const active = location === item.path || location.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <Link key={`${item.label}-${index}`} href={item.path} className={cn("flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors", active ? "text-brand-bright" : "text-muted-foreground hover:text-foreground")}>
              <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(244,122,11,0.6)]")} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ClientDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const [logo] = useState(getBrandLogo);

  return (
    <>
      {open && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />}
      <aside className={cn("fixed bottom-0 left-0 top-0 z-50 w-[82vw] max-w-[320px] border-r border-border bg-card p-4 shadow-2xl shadow-black/70 transition-transform duration-200", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="CHURRASPÃO E CIA" className="h-14 w-14 rounded-full object-cover ring-2 ring-brand/60" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold leading-tight">{BRAND.name}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-bright">App oficial</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 grid gap-1">
          {NAV.map((item, index) => {
            const Icon = item.icon;
            const active = location === item.path || location.startsWith(`${item.path}/`);
            return (
              <Link key={`${item.label}-${index}`} href={item.path} onClick={onClose} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors", active ? "bg-brand text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user, isAuthenticated } = useAuth();
  const [logo, setLogo] = useState(getBrandLogo);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setLogo(getBrandLogo());
    window.addEventListener("churraspao-catalog-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("churraspao-catalog-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 px-4 py-3 md:max-w-5xl">
          <button onClick={() => setMenuOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="CHURRASPÃO E CIA" className="h-11 w-11 rounded-full object-cover ring-2 ring-brand/60" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight">{title ?? BRAND.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{subtitle ?? "Entrega em toda a cidade"}</p>
          </div>
          <Link href="/perfil" className={cn("text-xs font-semibold", isAuthenticated ? "text-brand-bright" : "text-muted-foreground")} onClick={(event) => !isAuthenticated && event.preventDefault()}>
            {isAuthenticated ? `Olá, ${user?.name?.split(" ")[0] ?? "Rafael"}` : "Entrar"}
          </Link>
        </div>
      </header>
      <ClientDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export function useSplash() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem("churraspaoo-splash"));

  useEffect(() => {
    if (!visible) return;

    sessionStorage.setItem("churraspaoo-splash", "1");
    const timer = setTimeout(() => setVisible(false), 1200);

    return () => clearTimeout(timer);
  }, [visible]);

  return visible;
}

export function SplashScreen() {
  const [logo] = useState(getBrandLogo);

  return (
    <div className="charcoal-texture fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#0B0B0B] px-8">
      <div className="relative">
        <span className="pulse-ember absolute -inset-5 rounded-full bg-brand/20 blur-2xl" />
        <img src={logo} alt="CHURRASPÃO E CIA" className="ember-glow fade-up relative h-36 w-36 rounded-full object-cover" />
      </div>
      <h1 className="fade-up font-display text-3xl font-bold tracking-wide">{BRAND.name}</h1>
      <p className="fade-up text-sm font-semibold text-brand-bright">Seu pedido começa aqui</p>
    </div>
  );
}

export function AppLayout({ children, showHeader = true }: { children: React.ReactNode; showHeader?: boolean }) {
  const splash = useSplash();

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-8">
      {splash && <SplashScreen />}
      {showHeader && <AppHeader />}
      <main>{children}</main>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) startLogin();
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
