import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Check, Flame, Store, Truck, PartyPopper } from "lucide-react";
import { AppHeader } from "@/components/AppLayout";
import { formatBRL, STATUS_LABELS, STATUS_EMOJI, TRACKING_STEPS } from "@/lib/brand";
import { getOrderByCode, groupOrderItems, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";

const PICKUP_TRACKING_STEPS = ["new", "accepted", "preparing", "ready", "finished"] as const;

const STEP_ICONS: Record<string, typeof Check> = {
  new: Store,
  accepted: Check,
  preparing: Flame,
  ready: Store,
  delivering: Truck,
  finished: PartyPopper,
};

const STEP_MESSAGES: Record<string, string> = {
  new: "Recebemos seu pedido! O restaurante já está de olho 🔍",
  accepted: "Pedido aceito! A chapa vai esquentar 🔥",
  preparing: "Seu churrasco está na brasa! Cheiro bom chegando 👨‍🍳",
  ready: "Tudo pronto! Embalando seu pedido 📦",
  delivering: "Seu pedido saiu para entrega! Vem aí 🏍️",
  finished: "Entregue! Bom apetite e volte sempre ❤️",
};

export default function Pedido() {
  const { code } = useParams<{ code: string }>();
  const [localOrder, setLocalOrder] = useState<LocalOrder | null>(null);
  const order = useMemo(() => localOrder, [localOrder]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const nextOrder = code ? await getOrderByCode(code) : null;
      if (active) setLocalOrder(nextOrder);
    };

    void refresh();
    const unsubscribe = subscribeToOrders(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [code]);

  useEffect(() => {
    if (order && order.status === "finished") document.title = "Entregue! | CHURRASPÃO E CIA";
  }, [order]);

  const trackingSteps = order?.deliveryType === "pickup" ? PICKUP_TRACKING_STEPS : TRACKING_STEPS;
  const statusIdx = Math.max(0, trackingSteps.indexOf((order?.status ?? "new") as (typeof trackingSteps)[number]));
  const isFinished = order?.status === "finished";
  const isCancelled = order?.status === "cancelled";
  const orderItems = groupOrderItems(Array.isArray(order?.itemsJson) ? order.itemsJson : []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto w-full max-w-[430px] px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-card transition-colors" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="font-display font-bold text-sm flex-1">Pedido {order?.code ?? code}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[430px] px-3 pt-4 sm:px-4 flex flex-col gap-5">
        {!order && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🤔</p>
            <p className="font-display text-lg font-semibold">Pedido não encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">Verifique o código ou faça um novo pedido.</p>
            <Link href="/cardapio" className="mt-4 inline-block text-brand-bright font-semibold hover:underline">Ir ao cardápio</Link>
          </div>
        )}
        {order && (
          <>
            {/* Status hero */}
            <div className={`rounded-3xl p-6 ${isCancelled ? "bg-card border-2 border-destructive" : isFinished ? "ember-glow bg-gradient-to-br from-[#2a1200] to-[#0B0B0B] border border-brand/40" : "bg-card border border-brand/40"}`}>
              <p className="text-5xl mb-3">{STATUS_EMOJI[order.status] ?? "🔥"}</p>
              <h1 className="font-display text-2xl font-bold">{isCancelled ? "Pedido cancelado" : STATUS_LABELS[order.status] ?? "Novo pedido"}</h1>
              <p className="text-sm text-muted-foreground mt-1.5">{isCancelled ? "Entre em contato com o restaurante para mais informações." : STEP_MESSAGES[order.status as string]}</p>
              {!isCancelled && (
                <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand to-brand-bright transition-all duration-500" style={{ width: `${((statusIdx + 1) / trackingSteps.length) * 100}%` }} />
                </div>
              )}
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-4">
                {trackingSteps.map((step, i) => {
                  const done = i <= statusIdx;
                  const current = i === statusIdx;
                  const Icon = STEP_ICONS[step];
                  return (
                    <div key={step} className={`flex items-center gap-3 ${i > 0 ? "" : ""}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${done ? "bg-brand text-white" : "bg-secondary text-muted-foreground"} ${current ? "ring-2 ring-brand-bright ring-offset-2 ring-offset-card pulse-ember" : ""}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABELS[step]}</p>
                        {current && <p className="text-[11px] text-brand-bright">{STEP_MESSAGES[step]}</p>}
                      </div>
                      {done && <Check className="h-4 w-4 text-green-400" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detalhes */}
            <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Código do pedido</span>
                <span className="font-mono font-bold text-brand-bright">{order.code}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Telefone</span>
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <span>{order.deliveryType === "delivery" ? "🚚 Entrega" : "🏪 Retirada"}</span>
              </div>
              {order.deliveryType === "delivery" && order.addressLine && (
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground shrink-0">Endereço</span>
                  <span className="text-right">{order.addressLine}{order.addressRef ? ` — ${order.addressRef}` : ""}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="capitalize">{order.paymentMethod === "pix" ? "PIX" : order.paymentMethod === "card" ? "Cartão" : "Dinheiro"}{order.changeFor ? ` (troco: ${order.changeFor})` : ""}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span>{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-display font-semibold uppercase text-sm">Total</span>
                <span className="font-display font-bold text-2xl text-brand-bright">{formatBRL(Number(order.total))}</span>
              </div>
            </div>

            {/* Itens */}
            <div className="rounded-2xl bg-card border border-border p-5 flex flex-col gap-2.5">
              <p className="font-display font-semibold text-sm">🍽️ O que você pediu</p>
              {orderItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Itens não encontrados neste pedido.</p>
              )}
              {orderItems.map((item) => (
                <div key={`${item.productId}-${item.variationId ?? "base"}-${item.productName}`} className="flex justify-between text-sm gap-3">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.productName}
                    {item.variationName && ` (${item.variationName})`}
                    {(item.addonNames ?? []).length > 0 && ` + ${(item.addonNames ?? []).join(", ")}`}
                  </span>
                  <span>{formatBRL(Number(item.unitPrice) * item.quantity)}</span>
                </div>
              ))}
            </div>

            {isFinished && (
              <Link href="/" className="btn-press rounded-2xl bg-brand py-3.5 text-center font-display font-bold text-white uppercase tracking-wide hover:bg-brand-bright transition-colors">
                Pedir de novo 🔥
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
