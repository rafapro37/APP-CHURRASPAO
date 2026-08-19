import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Flame, MapPin, Search, ShoppingBag, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import ContactButtons from "@/components/ContactButtons";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { BRAND } from "@/lib/brand";
import { getAllCategories, getAllProducts, getBrandLogo } from "@/lib/localCatalog";

function isSoldOutStatus(status: unknown) {
  const value = String(status ?? "available").trim().toLowerCase();
  return value !== "available";
}

export default function Home() {
  const { add, count } = useCart();
  const [categories, setCategories] = useState(getAllCategories);
  const [products, setProducts] = useState(getAllProducts);
  const [logo, setLogo] = useState(getBrandLogo);

  useEffect(() => {
    const refresh = () => {
      setCategories(getAllCategories());
      setProducts(getAllProducts());
      setLogo(getBrandLogo());
    };

    window.addEventListener("churraspao-catalog-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("churraspao-catalog-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const bestSellers = products
    .filter((product) => (product.salesCount ?? 0) > 0)
    .sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
    .slice(0, 6);
  const featured = products.filter((product) => product.isFeatured).slice(0, 8);
  const showcase = featured.length > 0 ? featured : products.slice(0, 8);

  const quickAdd = (product: (typeof products)[number]) => {
    if (isSoldOutStatus(product.status)) return;

    add({
      productId: product.id,
      productName: product.name,
      imageUrl: product.images[0]?.url,
      addonIds: [],
      addonNames: [],
      addonPrices: [],
      accompanimentSelections: [],
      quantity: 1,
      unitPrice: product.price,
    });
  };

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-[430px] px-4 pt-3 md:max-w-5xl">
        <div className="flex items-center gap-3">
          <img src={logo} alt="CHURRASPÃO E CIA" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand/60" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Olá, Rafael</p>
            <h1 className="font-display text-lg font-bold leading-tight">{BRAND.name}</h1>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-brand-bright" /> Entrega em toda a cidade
            </p>
          </div>
          <Link href="/carrinho" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span>}
          </Link>
        </div>

        <Link href="/cardapio" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4 text-brand-bright" />
          Buscar produto, categoria ou bebida...
        </Link>
      </section>

      <section className="mx-auto w-full max-w-[430px] px-4 pt-4 md:max-w-5xl">
        <Link href="/cardapio" className="group relative block overflow-hidden rounded-3xl border border-brand/40 bg-black shadow-[0_18px_60px_rgba(217,101,8,0.14)]">
          <img src={BRAND.heroBanner} alt="Banner Churraspão & Cia" className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]" />
          <span className="absolute bottom-3 left-3 rounded-full bg-brand px-4 py-2 font-display text-xs font-bold uppercase text-white shadow-lg shadow-brand/30">
            Ver cardapio
          </span>
        </Link>
      </section>

      <section className="mx-auto w-full max-w-[430px] px-4 pt-4 md:max-w-5xl">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {categories.map((category) => (
            <Link key={category.id} href={`/cardapio?categoria=${category.id}`} className="btn-press flex h-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-brand/60">
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="mx-auto w-full max-w-[430px] px-4 pt-6 md:max-w-5xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-brand-bright" />
              <h2 className="font-display text-xl font-bold">Mais pedidos</h2>
            </div>
            <Link href="/cardapio" className="flex items-center gap-1 text-sm font-semibold text-brand-bright">
              Ver tudo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={() => quickAdd(product)} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-[430px] px-4 pt-6 md:max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-bright" />
            <h2 className="font-display text-xl font-bold">Escolha seu pedido</h2>
          </div>
          <Link href="/cardapio" className="flex items-center gap-1 text-sm font-semibold text-brand-bright">
            Cardápio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {showcase.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={() => quickAdd(product)} />
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-[430px] px-4 pb-4 pt-8 md:max-w-5xl">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-center font-display text-lg font-bold">Fale com o Churraspao</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Delivery: {BRAND.whatsappLabel} | {BRAND.instagramLabel}
          </p>
          <div className="mt-3">
            <ContactButtons compact />
          </div>
        </div>
      </footer>

      {count > 0 && (
        <Link href="/carrinho" className="btn-press fade-up fixed bottom-24 left-4 right-4 z-40 mx-auto flex max-w-[398px] items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-display font-bold uppercase text-white shadow-2xl shadow-brand/40 transition-colors hover:bg-brand-bright md:bottom-8">
          <ShoppingBag className="h-4 w-4" /> Ver pedido ({count})
        </Link>
      )}
    </AppLayout>
  );
}
