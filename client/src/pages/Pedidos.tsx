import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Flame } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatBRL, STATUS_EMOJI, STATUS_LABELS } from "@/lib/brand";
import { getOrders, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";

export default function Pedidos() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const nextOrders = await getOrders();
      if (active) setOrders(nextOrders);
    };

    void refresh();
    const unsubscribe = subscribeToOrders(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-[430px] px-4 pt-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Flame className="h-6 w-6 text-brand-bright" /> Meus pedidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus pedidos feitos no app.</p>
      </section>

      <section className="mx-auto flex w-full max-w-[430px] flex-col gap-3 px-4 pt-4">
        {orders.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-lg font-semibold">Nenhum pedido ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Escolha seus produtos no cardápio para simular um pedido.</p>
            <Link href="/cardapio" className="btn-press mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-display text-sm font-bold uppercase text-white transition-colors hover:bg-brand-bright">
              Fazer meu primeiro pedido <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {orders.map((order) => (
          <Link key={order.id} href={`/pedido/${order.code}`} className="btn-press flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/50">
            <span className="text-sm font-bold text-brand-bright">{STATUS_EMOJI[order.status] ?? "Novo"}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold text-brand-bright">{order.code}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${order.status === "new" ? "bg-brand/20 text-brand-bright" : "bg-secondary text-muted-foreground"}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-1 truncate text-sm">{order.customerName} | {new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <span className="font-display font-bold text-brand-bright">{formatBRL(Number(order.total))}</span>
          </Link>
        ))}
      </section>
    </AppLayout>
  );
}
