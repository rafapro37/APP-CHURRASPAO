import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Plus, Send } from "lucide-react";
import { formatBRL, STATUS_LABELS } from "@/lib/brand";
import { getOrders, groupOrderItems, subscribeToOrders, updateOrderStatus, type LocalOrder } from "@/lib/localOrders";

export default function Garcom() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const refresh = () => {
    void getOrders().then(setOrders);
  };

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToOrders(refresh);
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-background pb-8 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[430px] items-center gap-3">
          <Link href="/" className="-ml-2 rounded-full p-2 hover:bg-card">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Painel do Garçom</h1>
            <p className="text-xs text-muted-foreground">Pedidos identificados pelo nome do cliente</p>
          </div>
          <Link href="/cardapio" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[430px] px-4 pt-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-brand-bright" />
            <p className="mt-3 font-display text-lg font-bold">Nenhum pedido</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie um pedido pelo cardápio e envie para a cozinha.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-bright">Pedido #{order.code}</p>
                    <h2 className="mt-1 font-display text-xl font-bold">Cliente: {order.customerName}</h2>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-brand-bright">{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>

                <div className="mt-3 rounded-xl bg-background p-3 text-xs text-muted-foreground">
                  {groupOrderItems(Array.isArray(order.itemsJson) ? order.itemsJson : []).map((item) => (
                    <div key={`${order.id}-${item.productId}-${item.productName}`} className="flex justify-between gap-3">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatBRL(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {order.observation && <p className="mt-3 text-xs text-muted-foreground">Observação: {order.observation}</p>}

                <div className="mt-4 flex gap-2">
                  <Link href="/cardapio" className="flex-1 rounded-xl border border-border px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
                    Alterar pedido
                  </Link>
                  <button
                    onClick={async () => {
                      await updateOrderStatus(order.id, "accepted");
                      refresh();
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white"
                  >
                    <Send className="h-4 w-4" /> Enviar cozinha
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
