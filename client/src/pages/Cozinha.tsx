import { useEffect, useMemo, useState } from "react";
import { Clock, Flame, CheckCircle2 } from "lucide-react";
import { STATUS_LABELS } from "@/lib/brand";
import { getOrders, groupOrderItems, subscribeToOrders, updateOrderStatus, type LocalOrder, type LocalOrderStatus } from "@/lib/localOrders";

const KITCHEN_FLOW: LocalOrderStatus[] = ["new", "accepted", "preparing", "ready", "finished"];

function minutesSince(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

async function setStatus(id: number | string, status: LocalOrderStatus, refresh: () => void) {
  await updateOrderStatus(id, status);
  refresh();
}

export default function Cozinha() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const refresh = () => {
    void getOrders().then(setOrders);
  };

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 30000);
    const unsubscribe = subscribeToOrders(refresh);
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const kitchenOrders = useMemo(
    () => orders.filter((order) => !["finished", "cancelled"].includes(order.status)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  const nextStatus = (status: LocalOrderStatus): LocalOrderStatus => {
    if (status === "new") return "preparing";
    if (status === "accepted") return "preparing";
    if (status === "preparing") return "ready";
    if (status === "ready") return "finished";
    return status;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Flame className="h-6 w-6 text-brand-bright" /> Cozinha
          </h1>
          <p className="text-sm text-muted-foreground">Pedidos em tempo real, identificados pelo nome do cliente.</p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl p-4">
        {kitchenOrders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-bright" />
            <p className="mt-3 font-display text-xl font-bold">Nenhum pedido na cozinha</p>
            <p className="mt-1 text-sm text-muted-foreground">Novos pedidos aparecerão automaticamente aqui.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kitchenOrders.map((order) => (
              <article key={order.id} className={`rounded-2xl border p-4 ${order.status === "new" ? "border-brand bg-brand/10 ember-glow" : "border-border bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-bright">PEDIDO {order.code}</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Pedido de {order.customerName}</h2>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-brand-bright">{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-background p-3">
                  {groupOrderItems(Array.isArray(order.itemsJson) ? order.itemsJson : []).map((item) => (
                    <div key={`${order.id}-${item.productId}-${item.productName}`} className="text-sm">
                      <p className="font-semibold">{item.quantity}x {item.productName}</p>
                      {(item.addonNames ?? []).length > 0 && <p className="text-xs text-muted-foreground">Adicionais: {item.addonNames.join(", ")}</p>}
                      {item.notes && <p className="text-xs text-muted-foreground">Obs item: {item.notes}</p>}
                    </div>
                  ))}
                </div>

                {order.observation && (
                  <div className="mt-3 rounded-xl border border-brand/30 bg-brand/10 p-3">
                    <p className="text-xs font-bold text-brand-bright">Observação</p>
                    <p className="mt-1 text-sm">{order.observation}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex items-center gap-1 font-semibold text-brand-bright">
                    <Clock className="h-4 w-4" /> {minutesSince(order.createdAt)} min
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {KITCHEN_FLOW.map((status) => (
                    <button key={status} onClick={() => setStatus(order.id, status, refresh)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${order.status === status ? "bg-brand text-white" : "bg-background text-muted-foreground"}`}>
                      {STATUS_LABELS[status] ?? status}
                    </button>
                  ))}
                </div>

                <button onClick={() => setStatus(order.id, nextStatus(order.status), refresh)} className="mt-3 w-full rounded-xl bg-brand py-3 font-display font-bold uppercase text-white">
                  Avançar status
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
