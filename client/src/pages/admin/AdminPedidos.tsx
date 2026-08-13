import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { formatBRL, STATUS_LABELS } from "@/lib/brand";
import { getOrders, groupOrderItems, subscribeToOrders, updateOrderStatus, type LocalOrder, type LocalOrderStatus } from "@/lib/localOrders";

const STATUS: LocalOrderStatus[] = ["new", "accepted", "preparing", "ready", "delivering", "finished", "cancelled"];

export default function AdminPedidos() {
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
    <AdminLayout title="Pedidos" subtitle="Pedidos recebidos em tempo real">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum pedido ainda. Faça uma simulação pelo app do cliente.
          </div>
        )}

        {orders.map((order) => (
          <article key={order.id} className={`rounded-2xl border p-4 ${order.status === "new" ? "border-brand bg-brand/10 ember-glow" : "border-border bg-card"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-brand-bright">#{order.code}</p>
                <h2 className="mt-1 font-display text-lg font-bold">{order.customerName}</h2>
                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-brand-bright">
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              {order.deliveryType === "delivery" ? order.addressLine || "Entrega" : "Retirada no local"}
            </p>

            <div className="mt-3 max-h-32 overflow-auto rounded-xl bg-background p-3 text-[11px] text-muted-foreground">
              {groupOrderItems(Array.isArray(order.itemsJson) ? order.itemsJson : []).map((item) => (
                <div key={`${order.id}-${item.productId}-${item.variationId ?? "base"}-${item.productName}`} className="flex justify-between gap-3">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>{formatBRL(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <strong className="text-brand-bright">{formatBRL(Number(order.total ?? 0))}</strong>
              <select
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none"
                value={order.status}
                onChange={async (event) => {
                  await updateOrderStatus(order.id, event.target.value as LocalOrderStatus);
                  refresh();
                }}
              >
                {STATUS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
