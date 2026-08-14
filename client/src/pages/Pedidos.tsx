import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Flame, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatBRL, STATUS_EMOJI, STATUS_LABELS } from "@/lib/brand";
import { getMyOrders, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";

function safeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponivel";
  return date.toLocaleDateString("pt-BR");
}

function safeMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return formatBRL(Number.isFinite(amount) ? amount : 0);
}

export default function Pedidos() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setError("");
    try {
      const nextOrders = await getMyOrders();
      setOrders(Array.isArray(nextOrders) ? nextOrders : []);
    } catch (caught) {
      console.error("[Churraspao] Falha na aba Meus pedidos:", caught);
      setError("Nao foi possivel carregar seus pedidos agora.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToOrders(() => {
      void refresh();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-[430px] px-4 pt-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Flame className="h-6 w-6 text-brand-bright" /> Meus pedidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe os pedidos feitos neste celular.</p>
      </section>

      <section className="mx-auto flex w-full max-w-[430px] flex-col gap-3 px-4 pt-4">
        {loading && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            Carregando seus pedidos...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-destructive/40 bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button onClick={() => void refresh()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-lg font-semibold">Nenhum pedido ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Escolha seus produtos no cardapio para fazer um pedido.</p>
            <Link href="/cardapio" className="btn-press mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-display text-sm font-bold uppercase text-white transition-colors hover:bg-brand-bright">
              Fazer meu primeiro pedido <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && !error && orders.map((order) => {
          const code = String(order.code || "");
          if (!code) return null;

          return (
            <Link key={`${order.id}-${code}`} href={`/pedido/${code}`} className="btn-press flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/50">
              <span className="text-sm font-bold text-brand-bright">{STATUS_EMOJI[order.status] ?? "Novo"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-bold text-brand-bright">{code}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${order.status === "new" ? "bg-brand/20 text-brand-bright" : "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[order.status] ?? "Novo pedido"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm">
                  {order.customerName || "Cliente"} | {safeDate(order.createdAt)}
                </p>
              </div>
              <span className="font-display font-bold text-brand-bright">{safeMoney(order.total)}</span>
            </Link>
          );
        })}
      </section>
    </AppLayout>
  );
}
