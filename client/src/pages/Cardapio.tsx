import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, Search, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ProductCard, type ProductSummary } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { BRAND } from "@/lib/brand";
import { getAllCategories, getAllProducts, getBrandLogo } from "@/lib/localCatalog";
import { cn } from "@/lib/utils";

function isSoldOutStatus(status: unknown) {
  const value = String(status ?? "available").trim().toLowerCase();
  return value !== "available";
}

export default function Cardapio() {
  const searchParams = useSearch();
  const initialCategory = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const category = params.get("categoria");
    return category ? Number(category) : null;
  }, [searchParams]);

  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(initialCategory);
  const [categories, setCategories] = useState(getAllCategories);
  const [products, setProducts] = useState(getAllProducts);
  const [logo, setLogo] = useState(getBrandLogo);
  const { add, count } = useCart();

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

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCat === null || product.categoryId === selectedCat;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        (product.shortDescription ?? "").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCat]);

  return (
    <AppLayout>
      <section className="sticky top-[61px] z-20 border-b border-border bg-[#0B0B0B]/95 pb-2.5 pt-2.5 backdrop-blur">
        <div className="mx-auto w-full max-w-[430px] px-3 md:max-w-5xl">
          <div className="flex items-center gap-2">
            <Link href="/" className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-card">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={logo} alt="CHURRASPAO E CIA" className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-brand/60" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-base font-bold leading-tight">Cardapio</h1>
              <p className="truncate text-[11px] text-muted-foreground">{BRAND.name}</p>
            </div>
            <Link href="/carrinho" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          </div>

          <div className="relative mt-2.5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto ou bebida..." className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/60" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[430px] px-3 pt-3 md:max-w-5xl">
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-2" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setSelectedCat(null)} className={cn("btn-press flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors", selectedCat === null ? "border-brand bg-brand text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            <UtensilsCrossed className="h-4 w-4" /> Tudo
          </button>
          {categories.map((category) => (
            <button key={category.id} onClick={() => setSelectedCat(category.id)} className={cn("btn-press flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-semibold transition-colors", selectedCat === category.id ? "border-brand bg-brand text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[430px] px-3 pt-2 md:max-w-5xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Produtos</h2>
          <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">{filtered.length} itens</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-lg font-semibold">Nada por aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro nome ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pb-8 md:grid-cols-4 md:gap-4">
            {filtered.map((product, index) => (
              <div key={product.id} className="fade-up" style={{ animationDelay: `${index * 25}ms` }}>
                <ProductCard
                  product={product as ProductSummary}
                  onAdd={() =>
                    !isSoldOutStatus(product.status) &&
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
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {count > 0 && (
        <Link href="/carrinho" className="btn-press fade-up fixed bottom-24 left-4 right-4 z-40 mx-auto flex max-w-[398px] items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-display font-bold uppercase text-white shadow-2xl shadow-brand/40 transition-colors hover:bg-brand-bright md:bottom-8">
          <ShoppingBag className="h-4 w-4" /> Ver pedido ({count})
        </Link>
      )}
    </AppLayout>
  );
}
