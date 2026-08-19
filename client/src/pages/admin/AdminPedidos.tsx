import { useEffect, useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { formatBRL, STATUS_LABELS } from "@/lib/brand";
import { getOrders, groupOrderItems, subscribeToOrders, updateOrderStatus, type LocalOrder, type LocalOrderStatus } from "@/lib/localOrders";

const STATUS: LocalOrderStatus[] = ["new", "accepted", "preparing", "ready", "delivering", "finished", "cancelled"];
const ARCHIVED_ORDERS_KEY = "churraspao-admin-archived-orders";

function readArchivedOrders() {
  if (typeof window === "undefined") return [];
  try {
    return (JSON.parse(localStorage.getItem(ARCHIVED_ORDERS_KEY) ?? "[]") as string[]).filter(Boolean);
  } catch {
    return [];
  }
}

function writeArchivedOrders(codes: string[]) {
  localStorage.setItem(ARCHIVED_ORDERS_KEY, JSON.stringify(Array.from(new Set(codes))));
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [archivedCodes, setArchivedCodes] = useState<string[]>(readArchivedOrders);
  const [showArchived, setShowArchived] = useState(false);

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

  const archiveOrder = (code: string) => {
    const next = Array.from(new Set([...archivedCodes, code]));
    writeArchivedOrders(next);
    setArchivedCodes(next);
  };

  const restoreOrder = (code: string) => {
    const next = archivedCodes.filter((item) => item !== code);
    writeArchivedOrders(next);
    setArchivedCodes(next);
  };

  const archivedSet = new Set(archivedCodes);
  const visibleOrders = orders.filter((order) => !archivedSet.has(order.code));
  const archivedOrders = orders.filter((order) => archivedSet.has(order.code));
  const displayedOrders = showArchived ? archivedOrders : visibleOrders;

  return (
    <AdminLayout title="Pedidos" subtitle="Pedidos recebidos em tempo real">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <div>
          <p className="font-display text-lg font-bold">{showArchived ? "Pedidos removidos da lista" : "Pedidos ativos no gerenciamento"}</p>
          <p className="text-xs text-muted-foreground">
            Pedidos finalizados podem ser removidos da lista sem apagar o historico do sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-brand/60 hover:text-brand-bright"
        >
          {showArchived ? "Ver pedidos ativos" : `Ver removidos (${archivedOrders.length})`}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {displayedOrders.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {showArchived ? "Nenhum pedido removido da lista." : "Nenhum pedido ainda. Faca uma simulacao pelo app do cliente."}
          </div>
        )}

        {displayedOrders.map((order) => (
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

            <div className="mt-3 flex justify-end">
              {showArchived ? (
                <button
                  type="button"
                  onClick={() => restoreOrder(order.code)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-brand/60 hover:text-brand-bright"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar
                </button>
              ) : (
                (order.status === "finished" || order.status === "cancelled") && (
                  <button
                    type="button"
                    onClick={() => archiveOrder(order.code)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-brand/60 hover:text-brand-bright"
                  >
                    <Archive className="h-4 w-4" />
                    Remover da lista
                  </button>
                )
              )}
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
