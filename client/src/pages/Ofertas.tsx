import { Link } from "wouter";
import { Ticket, Flame, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { formatBRL } from "@/lib/brand";
import { Badge, type ProductSummary } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Ofertas() {
  const { data: promos } = trpc.catalog.activePromotions.useQuery();
  const { data: products } = trpc.catalog.products.useQuery();
  const { add } = useCart();

  const productById = (id: number | null | undefined) => (products ?? []).find((p) => p.id === id) ?? null;

  const quickAdd = (product: { id: number; name: string; images?: { url: string }[]; price: number }) => {
    add({ productId: product.id, productName: product.name, imageUrl: product.images?.[0]?.url, addonIds: [], addonNames: [], addonPrices: [], accompanimentSelections: [], quantity: 1, unitPrice: product.price });
  };

  const featured = (products ?? []).filter((p) => (p.isOffer || p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < p.price) && (p.activePromo == null));

  return (
    <AppLayout>
      <section className="max-w-4xl mx-auto px-4 pt-5">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6 text-brand-bright" /> Ofertas & promoções</h1>
        <p className="text-sm text-muted-foreground mt-1">Ativadas automaticamente no horário programado ⏰</p>
      </section>

      {/* Banner hero de ofertas */}
      <section className="max-w-4xl mx-auto px-4 mt-4">
        <div className="relative rounded-3xl overflow-hidden border border-brand/40 ember-glow">
          <img src="/brand/hero-banner.png" alt="Ofertas do Churraspão" className="w-full aspect-[21/9] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display text-2xl md:text-3xl font-bold">HOJE TEM CHURRASPÃO</p>
            <p className="text-sm text-white/85 mt-1">As melhores ofertas de churrasco da cidade — só aqui no app.</p>
          </div>
        </div>
      </section>

      {/* Promoções ativas com agendamento */}
      <section className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="font-display text-xl font-bold mb-4">⏰ No ar agora</h2>
        <div className="flex flex-col gap-3">
          {promos?.map((promo) => {
            const product = productById(promo.productId);
            return (
              <div key={promo.id} className="rounded-2xl bg-card border border-brand/40 overflow-hidden flex flex-col sm:flex-row fade-up">
                {promo.imageUrl ? (
                  <img src={promo.imageUrl} alt={promo.title} className="h-40 sm:w-56 w-full object-cover" loading="lazy" />
                ) : product?.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={promo.title} className="h-40 sm:w-56 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-40 sm:w-56 w-full bg-secondary flex items-center justify-center text-4xl">🔥</div>
                )}
                <div className="flex-1 p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase rounded-full bg-brand px-2.5 py-0.5 text-white">Ativa</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> automática</span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{promo.title}</h3>
                  {promo.subtitle && <p className="text-xs text-muted-foreground">{promo.subtitle}</p>}
                  <div className="flex items-baseline gap-2 mt-1">
                    {promo.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatBRL(promo.originalPrice)}</span>}
                    {promo.promoPrice && <span className="font-display font-bold text-xl text-brand-bright">{formatBRL(promo.promoPrice)}</span>}
                  </div>
                  {(promo.dayOfWeek !== null || promo.startHour) && (
                    <p className="text-[11px] text-brand-bright mt-1">
                      {promo.dayOfWeek !== null && `${DAYS[promo.dayOfWeek]} • `}
                      {promo.startHour && `${promo.startHour} às ${promo.endHour ?? "fim"}`}
                    </p>
                  )}
                  {product && (
                    <button onClick={() => quickAdd({ id: product.id, name: product.name, images: product.images, price: promo.promoPrice ?? product.price })} className="btn-press mt-2 self-start rounded-xl bg-brand px-4 py-2 text-xs font-display font-bold text-white uppercase hover:bg-brand-bright transition-colors">
                      Aproveitar 🔥
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!promos?.length && (
          <p className="text-center text-muted-foreground text-sm py-10">Nenhuma promoção agendada no momento — fique de olho que elas ativam sozinhas!</p>
        )}
      </section>

      {/* Produtos em oferta */}
      <section className="max-w-4xl mx-auto px-4 mt-8 pb-4">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Flame className="h-5 w-5 text-brand-bright" /> Produtos com desconto</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {featured.map((p, i) => (
            <div key={p.id} style={{ animationDelay: `${i * 40}ms` }} className="fade-up">
              <div className="group rounded-2xl bg-card border border-border overflow-hidden transition-all hover:border-brand/50 flex flex-col">
                <Link href={`/produto/${p.id}`} className="relative block aspect-[4/3] overflow-hidden bg-secondary">
                  {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
                  <Badge className="absolute top-2 left-2">🏷️ Oferta</Badge>
                </Link>
                <div className="p-3.5 flex-1 flex flex-col">
                  <Link href={`/produto/${p.id}`}>
                    <h3 className="font-display font-semibold text-sm leading-snug">{p.name}</h3>
                  </Link>
                  <div className="mt-auto pt-2">
                    <span className="block text-[11px] text-muted-foreground line-through">{formatBRL(p.price)}</span>
                    <span className="font-display font-bold text-lg text-brand-bright">{formatBRL(p.promoPrice!)}</span>
                  </div>
                  <button onClick={() => quickAdd(p as never)} className="btn-press mt-2 rounded-xl bg-secondary py-2 text-xs font-bold uppercase hover:bg-brand hover:text-white transition-colors">
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {featured.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">Nenhum produto em oferta agora.</p>}
      </section>
    </AppLayout>
  );
}
