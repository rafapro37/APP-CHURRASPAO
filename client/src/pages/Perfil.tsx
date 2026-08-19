import { Link } from "wouter";
import { Heart, Flame, Award, Clock, LogOut, User as UserIcon, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import ContactButtons from "@/components/ContactButtons";
import { BRAND, formatBRL } from "@/lib/brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

export default function Perfil() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: me } = trpc.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: orders } = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  const points = me?.loyaltyPoints ?? 0;
  const nextReward = Math.floor(points / 10) + 1;
  const progress = (points % 10) / 10;

  const handleLogout = async () => {
    await logout();
    toast.success("Até a próxima! 👋");
  };

  return (
    <AppLayout>
      <section className="max-w-2xl mx-auto px-4 pt-6 flex flex-col gap-5">
        {/* Cartão do usuário */}
        <div className="relative rounded-3xl bg-card border border-border overflow-hidden p-6">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand to-brand-bright flex items-center justify-center font-display text-2xl font-bold">
                  {(user?.name ?? me?.name ?? "C")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{user?.name ?? me?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email ?? "cliente"}</p>
                  <p className="text-[11px] text-brand-bright font-semibold mt-0.5">🔥 Cliente Churraspão</p>
                </div>
                <button onClick={handleLogout} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors rounded-full border border-border px-3 py-1.5">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              </div>
              {/* Fidelidade */}
              <div className="mt-5 rounded-2xl bg-background/60 border border-brand/30 p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-bright" />
                  <p className="font-display font-bold text-sm uppercase">Clube Churraspão</p>
                  <span className="ml-auto text-xs font-semibold text-brand-bright">{points} pontos</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">A cada R$ 10 em pedidos você ganha 1 ponto. A cada 10 pontos, um brinde especial do chef 🎁</p>
                <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand to-brand-bright transition-all duration-700" style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Faltam <span className="text-brand-bright font-bold">{10 - (points % 10)}</span> pontos para o próximo brinde</p>
              </div>
              {/* Estatísticas */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-background/60 border border-border p-4 text-center">
                  <Flame className="h-5 w-5 text-brand-bright mx-auto" />
                  <p className="font-display font-bold text-xl mt-1">{orders?.length ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">pedidos feitos</p>
                </div>
                <div className="rounded-2xl bg-background/60 border border-border p-4 text-center">
                  <Heart className="h-5 w-5 text-red-400 mx-auto" />
                  <p className="font-display font-bold text-xl mt-1">{formatBRL((orders ?? []).reduce((s, o) => s + Number(o.total), 0))}</p>
                  <p className="text-[11px] text-muted-foreground">já investido em churrasco</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <div className="h-20 w-20 rounded-full bg-secondary border border-border flex items-center justify-center">
                <UserIcon className="h-9 w-9 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-bold">Entre para aproveitar tudo</p>
              <p className="text-sm text-muted-foreground max-w-xs">Acompanhe seus pedidos em tempo real, acumule pontos no Clube Churraspão e receba ofertas exclusivas.</p>
              <button onClick={() => startLogin()} className="btn-press rounded-2xl bg-brand px-8 py-3 font-display font-bold text-white uppercase hover:bg-brand-bright transition-colors">
                Entrar
              </button>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col">
          <Link href="/pedidos" className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border">
            <Flame className="h-5 w-5 text-brand-bright" />
            <span className="flex-1 text-sm font-semibold">Meus pedidos</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/ofertas" className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors border-b border-border">
            <Heart className="h-5 w-5 text-red-400" />
            <span className="flex-1 text-sm font-semibold">Ofertas & cupons</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/cardapio" className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
            <Clock className="h-5 w-5 text-brand-bright" />
            <span className="flex-1 text-sm font-semibold">Cardápio completo</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="font-display text-lg font-bold">Contato oficial</p>
          <p className="mt-1 text-xs text-muted-foreground">
            WhatsApp {BRAND.whatsappLabel} | Instagram {BRAND.instagramLabel}
          </p>
          <div className="mt-3">
            <ContactButtons compact />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          CHURRASPÃO E CIA • Churrasco de verdade, do nosso jeito.
        </p>
      </section>
    </AppLayout>
  );
}
