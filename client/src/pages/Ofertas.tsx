import { Link } from "wouter";
import { Clock, Flame, Ticket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AppLayout } from "@/components/AppLayout";
import { formatBRL } from "@/lib/brand";
import { Badge } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function Ofertas() {
  const { data: promos } = trpc.catalog.activePromotions.useQuery();
  const { data: products } = trpc.catalog.products.useQuery();
  const { add } = useCart();

  const productById = (id: number | null | undefined) => (products ?? []).find((p) => p.id === id) ?? null;

  const quickAdd = (product: { id: number; name: string; images?: { url: string }[]; price: number }) => {
    add({
      productId: product.id,
      productName: product.name,
      imageUrl: product.images?.[0]?.url,
      addonIds: [],
      addonNames: [],
      addonPrices: [],
      accompanimentSelections: [],
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const featured = (products ?? []).filter((product) => {
    const hasPromoPrice = product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price;
    return (product.isOffer || hasPromoPrice) && product.activePromo == null;
  });

  return (
    <AppLayout>
      <section className="mx-auto max-w-4xl px-4 pt-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Ticket className="h-6 w-6 text-brand-bright" /> Ofertas e promocoes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Produtos marcados como oferta no painel administrativo.</p>
      </section>

      <section className="mx-auto mt-4 max-w-4xl px-4">
        <div className="ember-glow relative overflow-hidden rounded-3xl border border-brand/40">
          <img src="/brand/hero-banner.png" alt="Ofertas do Churraspao" className="aspect-[21/9] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/90 via-[#0B0B0B]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="inline-block max-w-[92%] rounded-2xl bg-black/75 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <p className="font-display text-xl font-bold sm:text-3xl">PROMOCOES DO CHURRASPAO</p>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">Confira os itens em oferta cadastrados no app.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-4xl px-4">
        <h2 className="mb-4 font-display text-xl font-bold">No ar agora</h2>
        <div className="flex flex-col gap-3">
          {promos?.map((promo) => {
            const product = productById(promo.productId);
            return (
              <div key={promo.id} className="fade-up flex flex-col overflow-hidden rounded-2xl border border-brand/40 bg-card sm:flex-row">
                {promo.imageUrl ? (
                  <img src={promo.imageUrl} alt={promo.title} className="h-40 w-full object-cover sm:w-56" loading="lazy" />
                ) : product?.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={promo.title} className="h-40 w-full object-cover sm:w-56" loading="lazy" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-secondary text-sm text-muted-foreground sm:w-56">Sem foto</div>
                )}
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">Ativa</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> automatica
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{promo.title}</h3>
                  {promo.subtitle && <p className="text-xs text-muted-foreground">{promo.subtitle}</p>}
                  <div className="mt-1 flex items-baseline gap-2">
                    {promo.originalPrice && <span className="text-sm text-muted-foreground line-through">{formatBRL(promo.originalPrice)}</span>}
                    {promo.promoPrice && <span className="font-display text-xl font-bold text-brand-bright">{formatBRL(promo.promoPrice)}</span>}
                  </div>
                  {(promo.dayOfWeek !== null || promo.startHour) && (
                    <p className="mt-1 text-[11px] text-brand-bright">
                      {promo.dayOfWeek !== null && `${DAYS[promo.dayOfWeek]} - `}
                      {promo.startHour && `${promo.startHour} as ${promo.endHour ?? "fim"}`}
                    </p>
                  )}
                  {product && (
                    <button onClick={() => quickAdd({ id: product.id, name: product.name, images: product.images, price: promo.promoPrice ?? product.price })} className="btn-press mt-2 self-start rounded-xl bg-brand px-4 py-2 font-display text-xs font-bold uppercase text-white transition-colors hover:bg-brand-bright">
                      Aproveitar oferta
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!promos?.length && <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma promocao cadastrada no momento.</p>}
      </section>

      <section className="mx-auto mt-8 max-w-4xl px-4 pb-4">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Flame className="h-5 w-5 text-brand-bright" /> Produtos com desconto
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {featured.map((product, index) => (
            <div key={product.id} style={{ animationDelay: `${index * 40}ms` }} className="fade-up">
              <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand/50">
                <Link href={`/produto/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-secondary">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="h-full w-full object-contain object-center p-1" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem foto</div>
                  )}
                  <Badge className="absolute left-2 top-2">Oferta</Badge>
                </Link>
                <div className="flex flex-1 flex-col p-3.5">
                  <Link href={`/produto/${product.id}`}>
                    <h3 className="font-display text-sm font-semibold leading-snug">{product.name}</h3>
                  </Link>
                  <div className="mt-auto pt-2">
                    <span className="block text-[11px] text-muted-foreground line-through">{formatBRL(product.price)}</span>
                    <span className="font-display text-lg font-bold text-brand-bright">{formatBRL(product.promoPrice ?? product.price)}</span>
                  </div>
                  <button onClick={() => quickAdd(product)} className="btn-press mt-2 rounded-xl bg-secondary py-2 text-xs font-bold uppercase transition-colors hover:bg-brand hover:text-white">
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {featured.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhum produto em oferta agora.</p>}
      </section>
    </AppLayout>
  );
}
