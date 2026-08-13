import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, MapPin, Truck, Store, CreditCard, Banknote, QrCode, ClipboardCopy, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppLayout";
import { useCart } from "@/contexts/CartContext";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, formatBRL, formatPhone } from "@/lib/brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { registerProductSales } from "@/lib/localCatalog";
import { createOrder } from "@/lib/localOrders";

type PaymentMethod = "pix" | "card" | "cash" | "online";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof QrCode; detail: string }[] = [
  { value: "pix", label: "PIX", icon: QrCode, detail: "Aprovação imediata" },
  { value: "card", label: "Cartão", icon: CreditCard, detail: "Débito ou crédito na entrega" },
  { value: "cash", label: "Dinheiro", icon: Banknote, detail: "Pagamento na entrega" },
];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressRef, setAddressRef] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [observation, setObservation] = useState("");
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title="CHECKOUT" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <p className="text-6xl">🛒</p>
          <p className="font-display text-lg font-semibold">Adicione itens antes de fechar o pedido</p>
          <Link href="/cardapio" className="btn-press rounded-2xl bg-brand px-6 py-3 font-display font-bold text-white uppercase hover:bg-brand-bright transition-colors">
            Ir ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = deliveryType === "delivery" && subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryType === "delivery" ? DELIVERY_FEE : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const validate = (): string | null => {
    if (!customerName.trim()) return "Informe seu nome";
    if (phone.replace(/\D/g, "").length < 10) return "Informe um telefone válido";
    if (deliveryType === "delivery" && address.trim().length < 10) return "Informe o endereço completo de entrega";
    return null;
  };

  const handlePlace = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setPlacing(true);
    try {
      const itemsJson = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl,
        variationId: i.variationId,
        variationName: i.variationName,
        variationPrice: i.variationPrice,
        addonIds: i.addonIds,
        addonNames: i.addonNames,
        addonPrices: i.addonPrices,
        accompanimentSelections: i.accompanimentSelections,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        ...(i.notes ? { notes: i.notes } : {}),
      }));
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: phone.replace(/\D/g, ""),
        deliveryType,
        addressLine: deliveryType === "delivery" ? address.trim() : undefined,
        addressRef: deliveryType === "delivery" ? addressRef.trim() || undefined : undefined,
        paymentMethod: payment,
        changeFor: payment === "cash" && changeFor.trim() ? changeFor.trim() : undefined,
        observation: observation.trim() || undefined,
        subtotal,
        deliveryFee,
        total,
        itemsJson,
      });
      registerProductSales(items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
      clear();
      toast.success("Pedido recebido");
      navigate(`/pedido/${order.code}`);
    } catch (e: unknown) {
      toast.error("Não foi possível criar o pedido");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-3 px-4 py-3">
          <Link href="/carrinho" className="p-2 -ml-2 rounded-full hover:bg-card transition-colors" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="font-display font-bold text-sm flex-1">Finalizar pedido</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-3 pt-4 sm:px-4">
        {/* Tipo de pedido */}
        <section className="rounded-2xl bg-card border border-border p-2 grid grid-cols-2 gap-2">
          {([
            { value: "delivery", icon: Truck, label: "Entrega", detail: "🕐 30-50 min" },
            { value: "pickup", icon: Store, label: "Retirar no local", detail: "🕐 ~20 min" },
          ] as const).map((opt) => (
            <button key={opt.value} onClick={() => setDeliveryType(opt.value)} className={cn("btn-press rounded-xl border p-3 text-left transition-all", deliveryType === opt.value ? "border-brand-bright bg-brand/10 ring-1 ring-brand-bright" : "border-border bg-background hover:border-brand/50")}>
              <div className="flex items-center gap-2">
                <opt.icon className="h-4 w-4 text-brand-bright" />
                <span className="font-display font-bold text-sm uppercase">{opt.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{opt.detail}</p>
            </button>
          ))}
        </section>

        {/* Dados */}
        <section className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3">
          <p className="font-display font-semibold text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-brand-bright" /> Seus dados</p>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nome *</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome" className="mt-1 w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Telefone / WhatsApp *</label>
            <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="tel" className="mt-1 w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
          </div>
          {deliveryType === "delivery" && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço de entrega *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, complemento" className="mt-1 w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Ponto de referência</label>
                <input value={addressRef} onChange={(e) => setAddressRef(e.target.value)} placeholder="Ex: casa azul, portão preto" className="mt-1 w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Observação geral</label>
            <textarea value={observation} onChange={(e) => setObservation(e.target.value)} maxLength={2000} placeholder="Ex: sem cebola no lanche, entregar no fundo..." className="mt-1 w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-brand/60" />
          </div>
        </section>

        {/* Pagamento */}
        <section className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3">
          <p className="font-display font-semibold text-sm">💳 Forma de pagamento</p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setPayment(opt.value)} className={cn("btn-press flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all", payment === opt.value ? "border-brand-bright bg-brand/10 ring-1 ring-brand-bright" : "border-border bg-background hover:border-brand/50")}>
                <opt.icon className={cn("h-5 w-5", payment === opt.value ? "text-brand-bright" : "text-muted-foreground")} />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-[11px] text-muted-foreground">{opt.detail}</p>
                </div>
                {payment === opt.value && <span className="h-2.5 w-2.5 rounded-full bg-brand-bright pulse-ember" />}
              </button>
            ))}
          </div>
          {payment === "cash" && (
            <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-3.5 py-2.5">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <input value={changeFor} onChange={(e) => setChangeFor(formatPhone(e.target.value))} placeholder="Troco para quanto?" inputMode="numeric" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
          )}
          {payment === "pix" && (
            <div className="rounded-xl bg-background border border-border p-3 flex items-center gap-2">
              <QrCode className="h-4 w-4 text-brand-bright" />
              <p className="text-xs text-muted-foreground">O PIX será pago na confirmação do pedido. Você receberá os dados junto ao acompanhamento.</p>
            </div>
          )}
        </section>

        {/* Resumo */}
        <section className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-1.5">
          {items.map((i) => (
            <div key={i.cartId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {i.quantity}x {i.productName}
                {i.variationName && ` (${i.variationName})`}
              </span>
              <span>{formatBRL(Math.round(i.unitPrice * i.quantity * 100) / 100)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
            <span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> {deliveryType === "delivery" ? "Entrega" : "Retirada no local"}
            </span>
            <span>{deliveryFee === 0 && deliveryType === "delivery" ? <span className="text-green-400 font-semibold">GRÁTIS 🎉</span> : formatBRL(deliveryFee)}</span>
          </div>
          {subtotal < FREE_DELIVERY_THRESHOLD && deliveryType === "delivery" && (
            <p className="text-[11px] text-brand-bright">Faltam {formatBRL(FREE_DELIVERY_THRESHOLD - subtotal)} para a entrega grátis!</p>
          )}
          <div className="flex justify-between items-baseline border-t border-border pt-2 mt-1">
            <span className="font-display font-semibold uppercase text-sm">Total</span>
            <span className="font-display font-bold text-2xl text-brand-bright">{formatBRL(total)}</span>
          </div>
        </section>

        <button onClick={handlePlace} disabled={placing} className="btn-press rounded-2xl bg-brand py-4 font-display font-bold text-white uppercase tracking-wide hover:bg-brand-bright transition-colors disabled:opacity-50 shadow-lg shadow-brand/30 flex items-center justify-center gap-2">
          {placing ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ClipboardCopy className="h-5 w-5" />}
          {placing ? "Enviando pedido..." : `Confirmar pedido • ${formatBRL(total)}`}
        </button>
      </div>
    </div>
  );
}
