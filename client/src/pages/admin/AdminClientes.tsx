import { useEffect, useMemo, useState } from "react";
import { Bell, EyeOff, Gift, RefreshCw, UserX } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { formatBRL, formatPhone } from "@/lib/brand";
import { getOrders, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";

const HIDDEN_CUSTOMERS_KEY = "churraspao-hidden-customers";

type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  orders: LocalOrder[];
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function customerKey(name: string, phone: string) {
  const safePhone = phone.replace(/\D/g, "");
  const safeName = name.trim().toLowerCase();
  return safePhone || safeName;
}

function readHiddenCustomers() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_CUSTOMERS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function writeHiddenCustomers(keys: Set<string>) {
  localStorage.setItem(HIDDEN_CUSTOMERS_KEY, JSON.stringify(Array.from(keys)));
}

function buildCustomerSummaries(orders: LocalOrder[]) {
  const grouped = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const name = order.customerName?.trim() || "Cliente";
    const phone = order.customerPhone?.trim() || "";
    const key = customerKey(name, phone);
    if (!key) continue;

    const existing =
      grouped.get(key) ??
      ({
        key,
        name,
        phone,
        orders: [],
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt,
      } satisfies CustomerSummary);

    existing.orders.push(order);
    existing.orderCount += 1;
    existing.totalSpent += Number(order.total ?? 0);
    if (new Date(order.createdAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
      existing.lastOrderAt = order.createdAt;
      existing.name = name;
      existing.phone = phone;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());
}

async function sendCustomerCoupon(customer: CustomerSummary) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const code = `VOLTA${customer.orderCount}X`;

  const response = await fetch("/api/send-customer-coupon-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderCodes: customer.orders.map((order) => order.code),
      customerName: customer.name,
      couponCode: code,
      expiresAt: expiresAt.toISOString(),
    }),
  });

  if (!response.ok) throw new Error("Nao foi possivel enviar o cupom agora.");
  const result = (await response.json().catch(() => ({}))) as { sent?: number; message?: string };
  if (!result.sent) {
    throw new Error(result.message || "Cliente ainda nao permitiu notificacoes neste celular.");
  }
  return { code, expiresAt };
}

export default function AdminClientes() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [hiddenCustomers, setHiddenCustomers] = useState(readHiddenCustomers);
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  const refresh = () => {
    void getOrders().then(setOrders);
  };

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToOrders(refresh);
    return () => unsubscribe();
  }, []);

  const customers = useMemo(() => buildCustomerSummaries(orders).filter((customer) => !hiddenCustomers.has(customer.key)), [orders, hiddenCustomers]);
  const hiddenCount = hiddenCustomers.size;
  const frequentCustomers = customers.filter((customer) => customer.orderCount >= 2).length;

  const hideCustomer = (customer: CustomerSummary) => {
    const next = new Set(hiddenCustomers);
    next.add(customer.key);
    writeHiddenCustomers(next);
    setHiddenCustomers(next);
  };

  const restoreHidden = () => {
    const next = new Set<string>();
    writeHiddenCustomers(next);
    setHiddenCustomers(next);
  };

  const sendCoupon = async (customer: CustomerSummary) => {
    setSendingKey(customer.key);
    try {
      const sent = await sendCustomerCoupon(customer);
      alert(`Cupom ${sent.code} enviado para ${customer.name}. Valido ate ${sent.expiresAt.toLocaleDateString("pt-BR")}.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel enviar o cupom.");
    } finally {
      setSendingKey(null);
    }
  };

  return (
    <AdminLayout title="Clientes" subtitle="Clientes gerados automaticamente pelos pedidos">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Clientes ativos</p>
          <strong className="mt-1 block font-display text-3xl text-brand-bright">{customers.length}</strong>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Clientes frequentes</p>
          <strong className="mt-1 block font-display text-3xl">{frequentCustomers}</strong>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Pedidos usados</p>
          <strong className="mt-1 block font-display text-3xl">{orders.length}</strong>
        </div>
        <button onClick={restoreHidden} className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-brand">
          <RefreshCw className="h-5 w-5 text-brand-bright" />
          <p className="mt-2 text-xs uppercase text-muted-foreground">Restaurar removidos</p>
          <strong className="mt-1 block font-display text-2xl">{hiddenCount}</strong>
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum cliente vindo dos pedidos ainda. Quando alguem fizer pedido, aparece aqui automaticamente.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => {
            const lastOrder = customer.orders[0];
            const isFrequent = customer.orderCount >= 2;
            return (
              <article key={customer.key} className={`rounded-2xl border bg-card p-4 ${isFrequent ? "border-brand ember-glow" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">{customer.name}</h2>
                    <p className="text-sm text-muted-foreground">{customer.phone ? formatPhone(customer.phone) : "Sem telefone"}</p>
                  </div>
                  {isFrequent && <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase text-white">Frequente</span>}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">Pedidos</p>
                    <strong className="font-display text-2xl">{customer.orderCount}</strong>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">Total gasto</p>
                    <strong className="font-display text-xl text-brand-bright">{formatBRL(customer.totalSpent)}</strong>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-background p-3 text-xs text-muted-foreground">
                  <p>Ultimo pedido: <span className="text-foreground">{new Date(customer.lastOrderAt).toLocaleString("pt-BR")}</span></p>
                  <p className="mt-1">Codigo: <span className="text-brand-bright">{lastOrder?.code}</span></p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    disabled={!isFrequent || sendingKey === customer.key}
                    onClick={() => sendCoupon(customer)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Gift className="h-4 w-4" />
                    {sendingKey === customer.key ? "Enviando" : "Enviar cupom"}
                  </button>
                  <button onClick={() => hideCustomer(customer)} className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
                    <UserX className="h-4 w-4" />
                    Remover
                  </button>
                </div>

                {!isFrequent && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Bell className="h-3.5 w-3.5" />
                    O cupom libera automaticamente a partir de 2 pedidos.
                  </p>
                )}
                {hiddenCustomers.has(customer.key) && <EyeOff className="hidden" />}
              </article>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
