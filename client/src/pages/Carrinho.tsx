import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, Trash2, Plus, Minus, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AppHeader } from "@/components/AppLayout";
import { useCart, itemUnitPrice } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/brand";

export default function Carrinho() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const backLink = params.get("from") ?? "/cardapio";
  const { items, remove, setQuantity, subtotal, clear } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const redeem = trpc.coupons.redeem.useMutation();
  const { data: me } = trpc.auth.me.useQuery();

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um cupom");
      return;
    }
    setApplying(true);
    try {
      const result = await redeem.mutateAsync({ code: couponCode.trim(), subtotal, userId: me?.id ?? null });
      if (!result) {
        setCoupon(null);
        toast.error("Cupom inválido, expirado ou valor abaixo do mínimo");
        return;
      }
      setCoupon(result);
      toast.success(`Cupom ${result.code} aplicado! -$${formatBRL(result.discount)}`);
    } catch {
      setCoupon(null);
      toast.error("Não foi possível aplicar o cupom");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader title="CARRINHO" subtitle="Suas delícias te esperam aqui" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <p className="text-6xl">🛒</p>
          <p className="font-display text-lg font-semibold">Seu carrinho está vazio</p>
          <p className="text-sm text-muted-foreground text-center">A fome aperta, mas o carrinho precisa encher! Vá ao cardápio escolher suas delícias.</p>
          <Link href="/cardapio" className="btn-press mt-2 rounded-2xl bg-brand px-6 py-3 font-display font-bold text-white uppercase hover:bg-brand-bright transition-colors">
            Ir ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  const total = Math.round((subtotal - (coupon?.discount ?? 0)) * 100) / 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={backLink} className="p-2 -ml-2 rounded-full hover:bg-card transition-colors" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="font-display font-bold text-sm flex-1">Seu pedido 🔥</p>
          <button onClick={() => { clear(); toast.success("Carrinho limpo 🧹"); }} className="text-xs font-semibold text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 flex flex-col gap-4">
        {/* Itens */}
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const unit = itemUnitPrice(item);
            return (
              <div key={item.cartId} className="fade-up rounded-2xl bg-card border border-border p-3 flex gap-3">
                <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-secondary">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">🔥</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-tight">{item.productName}</p>
                    <button onClick={() => remove(item.cartId)} className="shrink-0 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-red-400 transition-colors" aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {(item.variationName || item.addonNames.length > 0) && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {item.variationName && <span className="text-brand-bright">⦁ {item.variationName}</span>}
                      {item.addonNames.map((n, i) => (
                        <span key={i}> {i === 0 ? "⦁" : "•"} {n}</span>
                      ))}
                    </p>
                  )}
                  {item.accompanimentSelections.some((s) => s.selected.length > 0) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.accompanimentSelections.filter((s) => s.selected.length).map((s) => `⦁ ${s.label}: ${s.selected.join(", ")}`).join("  ·  ")}
                    </p>
                  )}
                  {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">Obs: {item.notes}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-border overflow-hidden">
                      <button onClick={() => setQuantity(item.cartId, item.quantity - 1)} className="btn-press p-1.5 hover:bg-secondary transition-colors" aria-label="Diminuir">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => setQuantity(item.cartId, item.quantity + 1)} className="btn-press p-1.5 hover:bg-secondary transition-colors" aria-label="Aumentar">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-display font-bold text-brand-bright">{formatBRL(Math.round(unit * item.quantity * 100) / 100)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cupom */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="font-display font-semibold text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-brand-bright" /> Cupom de desconto</p>
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              placeholder="DIGITE O CÓDIGO (ex: CHURRAS10)"
              className={cn("flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm font-semibold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/60", coupon ? "border-green-500/50" : "border-border")}
            />
            <button onClick={applyCoupon} disabled={applying} className="btn-press rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50">
              {applying ? "..." : "Aplicar"}
            </button>
          </div>
          {coupon && (
            <p className="mt-2 text-xs font-semibold text-green-400">✓ Cupom {coupon.code} aplicado: -{formatBRL(coupon.discount)}</p>
          )}
        </div>

        {/* Resumo */}
        <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          {coupon && <div className="flex justify-between text-sm"><span className="text-green-400">Desconto do cupom</span><span className="text-green-400">-{formatBRL(coupon.discount)}</span></div>}
          <div className="border-t border-border pt-2 flex justify-between items-baseline">
            <span className="font-display font-semibold uppercase text-sm">Total</span>
            <span className="font-display font-bold text-2xl text-brand-bright">{formatBRL(total)}</span>
          </div>
        </div>

        <Link href="/checkout" className="btn-press rounded-2xl bg-brand py-4 text-center font-display font-bold text-white uppercase tracking-wide hover:bg-brand-bright transition-colors shadow-lg shadow-brand/30">
          Finalizar pedido 🔥
        </Link>
      </div>
    </div>
  );
}
