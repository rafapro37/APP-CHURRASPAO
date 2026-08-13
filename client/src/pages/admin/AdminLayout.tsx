import { Link, useLocation } from "wouter";
import { LayoutDashboard, Flame, UtensilsCrossed, ListOrdered, Ticket, Wallet, Users, LogOut, ShoppingBag, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BRAND } from "@/lib/brand";
import { getBrandLogo, saveBrandLogo } from "@/lib/localCatalog";
import { clearAccess } from "@/lib/accessControl";
import { toast } from "sonner";
import { useState } from "react";

const ADMIN_MENU = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/pedidos", label: "Pedidos", icon: Flame },
  { path: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { path: "/admin/categorias", label: "Categorias", icon: ListOrdered },
  { path: "/admin/promocoes", label: "Promocoes", icon: Ticket },
  { path: "/admin/cupons", label: "Cupons", icon: Wallet },
  { path: "/admin/clientes", label: "Clientes", icon: Users },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function AdminMenu() {
  const [location] = useLocation();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-2 md:py-1">
      {ADMIN_MENU.map((item) => {
        const isActive = item.path === "/admin" ? location === "/admin" : location.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link key={item.path} href={item.path} className={`flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition-colors md:h-auto md:rounded-lg md:py-2 md:text-sm ${isActive ? "bg-brand text-white" : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  const [logo, setLogo] = useState(getBrandLogo);

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="sticky top-0 z-30 border-b border-border bg-card md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-3 py-3 md:gap-3 md:px-4 md:py-4">
          <img src={logo} alt="CHURRASPAO E CIA" className="h-11 w-11 shrink-0 rounded-full object-contain ring-2 ring-brand/40 md:h-10 md:w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold leading-tight">{BRAND.name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-bright">Painel admin</p>
          </div>
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground md:hidden" aria-label="Ver app do cliente">
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
        <AdminMenu />
        <div className="hidden md:mt-auto md:block md:p-3">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ShoppingBag className="h-4 w-4" /> Ver app do cliente
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-[98px] z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold md:text-lg">{title ?? "Painel Administrativo"}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="btn-press inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <ImageUp className="h-4 w-4" />
              Logo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await fileToDataUrl(file);
                  saveBrandLogo(dataUrl);
                  setLogo(dataUrl);
                  toast.success("Logo atualizada");
                }}
              />
            </label>
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
        <main className="flex-1 p-3 pb-24 md:p-6 md:pb-8">{children}</main>
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
