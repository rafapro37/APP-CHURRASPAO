import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BellRing, ChevronLeft, Download, Flame, Home, Menu, Tag, Ticket, User, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import ContactButtons from "@/components/ContactButtons";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { subscribeToReadyOrderAlerts, type LocalOrder } from "@/lib/localOrders";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/inicio", label: "Inicio", icon: Home },
  { path: "/cardapio", label: "Cardapio", icon: UtensilsCrossed },
  { path: "/cardapio", label: "Categorias", icon: Tag },
  { path: "/ofertas", label: "Promocoes", icon: Ticket },
  { path: "/pedidos", label: "Meus pedidos", icon: Flame },
  { path: "/perfil", label: "Favoritos", icon: User },
  { path: "/perfil", label: "Minha conta", icon: User },
];

function vibrateReadyAlert() {
  if (!("vibrate" in navigator)) return;

  try {
    navigator.vibrate([700, 220, 700, 220, 900]);
  } catch {
    // Alguns celulares bloqueiam vibracao pelo navegador. O aviso visual continua funcionando.
  }
}

async function requestNotificationPermissionSafely() {
  if (!("Notification" in window) || Notification.permission !== "default") return;

  try {
    await Notification.requestPermission();
  } catch {
    // Android/Chrome pode bloquear notificacoes sem service worker. Evita derrubar o app.
  }
}

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    setInstalled(Boolean(isStandalone));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
        App instalado neste aparelho.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-3">
      <button
        type="button"
        onClick={async () => {
          if (installPrompt) {
            await installPrompt.prompt();
            setInstallPrompt(null);
            return;
          }

          setShowHelp((value) => !value);
        }}
        className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/60 bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25"
      >
        <Download className="h-4 w-4" />
        Baixar app
      </button>
      {showHelp && (
        <div className="mt-3 rounded-xl border border-border bg-[#0B0B0B] p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-white">Como instalar no celular:</p>
          <p className="mt-1">No Chrome, toque nos tres pontinhos do navegador e escolha "Adicionar a tela inicial" ou "Instalar app".</p>
        </div>
      )}
    </div>
  );
}

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
      <aside className={cn("fixed bottom-0 left-0 top-0 z-50 w-[82vw] max-w-[320px] overflow-visible border-r border-border bg-[#111] text-white shadow-2xl shadow-black/70 transition-transform duration-200", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-full overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="CHURRASPAO E CIA" className="h-14 w-14 rounded-full object-contain ring-2 ring-brand/60" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold leading-tight">{BRAND.name}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-bright">App oficial</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary hover:border-brand" aria-label="Fechar menu">
            <ChevronLeft className="h-6 w-6" />
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
        <div className="mt-6 rounded-2xl border border-border bg-background/40 p-3">
          <p className="mb-2 font-display text-sm font-bold">Contato oficial</p>
          <ContactButtons compact />
        </div>
        <div className="mt-3">
          <InstallAppButton />
        </div>
        </div>
      </aside>
    </>
  );
}

export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
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

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-[#0B0B0B]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-2 px-3 py-2.5 md:max-w-5xl">
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="CHURRASPAO E CIA" className="h-10 w-10 shrink-0 rounded-full object-contain ring-1 ring-brand/60" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight">{title ?? BRAND.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{subtitle ?? "Entrega em toda a cidade"}</p>
          </div>
          {isAuthenticated && (
            <Link href="/perfil" className="shrink-0 text-xs font-semibold text-brand-bright">
              Ola, {user?.name?.split(" ")[0] ?? "Rafael"}
            </Link>
          )}
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
        <img src={logo} alt="CHURRASPAO E CIA" className="ember-glow fade-up relative h-36 w-36 rounded-full object-contain" />
      </div>
      <h1 className="fade-up font-display text-3xl font-bold tracking-wide">{BRAND.name}</h1>
      <p className="fade-up text-sm font-semibold text-brand-bright">Seu pedido comeca aqui</p>
    </div>
  );
}

export function AppLayout({ children, showHeader = true }: { children: React.ReactNode; showHeader?: boolean }) {
  const splash = useSplash();
  const [readyOrder, setReadyOrder] = useState<LocalOrder | null>(null);

  useEffect(() => {
    return subscribeToReadyOrderAlerts((order) => {
      setReadyOrder(order);
      window.setTimeout(() => setReadyOrder((current) => (current?.code === order.code ? null : current)), 9000);

      vibrateReadyAlert();
      void requestNotificationPermissionSafely();
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-8">
      {splash && <SplashScreen />}
      {showHeader && <AppHeader />}
      {readyOrder && (
        <Link href={`/pedido/${readyOrder.code}`} className="ready-toast fixed left-3 right-3 top-3 z-[70] mx-auto flex max-w-[430px] items-center gap-3 rounded-2xl border border-brand bg-[#171717] p-3 shadow-2xl shadow-brand/30">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <BellRing className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-bold">Pedido pronto</span>
            <span className="block truncate text-xs text-muted-foreground">{readyOrder.customerName} - toque para acompanhar</span>
          </span>
        </Link>
      )}
      <main>{children}</main>
    </div>
  );
}
