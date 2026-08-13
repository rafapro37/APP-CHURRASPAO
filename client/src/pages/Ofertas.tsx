import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Flame, Ticket } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatBRL } from "@/lib/brand";
import { Badge } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { getAllProducts, type LocalProduct } from "@/lib/localCatalog";

export default function Ofertas() {
  const { add } = useCart();
  const [products, setProducts] = useState(getAllProducts);

  useEffect(() => {
    const refresh = () => setProducts(getAllProducts());
    window.addEventListener("churraspao-catalog-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("churraspao-catalog-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const offers = useMemo(
    () =>
      products.filter((product) => {
        const hasPromoPrice = product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price;
        return product.isOffer || hasPromoPrice;
      }),
    [products],
  );

  const quickAdd = (product: LocalProduct) => {
    if (product.price <= 0) return;
    add({
      productId: product.id,
      productName: product.name,
      imageUrl: product.images?.[0]?.url,
      addonIds: [],
      addonNames: [],
      addonPrices: [],
      accompanimentSelections: [],
      quantity: 1,
      unitPrice: product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price,
    });
  };

  return (
    <AppLayout>
      <section className="mx-auto max-w-4xl px-4 pt-5">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Ticket className="h-6 w-6 text-brand-bright" /> Promocoes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Itens marcados como oferta no painel administrativo.</p>
      </section>

      <section className="mx-auto mt-4 max-w-4xl px-4">
        <div className="ember-glow relative overflow-hidden rounded-3xl border border-brand/40">
          <img src="/brand/hero-banner.png" alt="Promocoes do Churraspao" className="aspect-[21/9] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/90 via-[#0B0B0B]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="inline-block max-w-[92%] rounded-2xl bg-black/75 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <p className="font-display text-xl font-bold sm:text-3xl">OFERTAS DO CHURRASPAO</p>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">Produtos em promocao cadastrados no app.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-4xl px-4 pb-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Flame className="h-5 w-5 text-brand-bright" /> Produtos em oferta
        </h2>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-display text-lg font-bold">Nenhuma promocao ativa</p>
            <p className="mt-1 text-sm text-muted-foreground">Marque um produto como Oferta no admin para aparecer aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {offers.map((product, index) => {
              const promoPrice = product.promoPrice && product.promoPrice > 0 ? product.promoPrice : product.price;
              return (
                <div key={product.id} style={{ animationDelay: `${index * 40}ms` }} className="fade-up">
                  <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand/50">
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
                        {product.shortDescription && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.shortDescription}</p>}
                      </Link>
                      <div className="mt-auto pt-2">
                        {product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price && <span className="block text-[11px] text-muted-foreground line-through">{formatBRL(product.price)}</span>}
                        <span className="font-display text-lg font-bold text-brand-bright">{formatBRL(promoPrice)}</span>
                      </div>
                      <button onClick={() => quickAdd(product)} className="btn-press mt-2 rounded-xl bg-brand py-2 text-xs font-bold uppercase text-white transition-colors hover:bg-brand-bright">
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
