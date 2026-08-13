import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppLayout";
import { Badge } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/brand";
import { getAllCategories, getAllProducts, type LocalProduct } from "@/lib/localCatalog";
import { cn } from "@/lib/utils";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { add } = useCart();

  const [products, setProducts] = useState(getAllProducts);
  const [categories, setCategories] = useState(getAllCategories);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setProducts(getAllProducts());
      setCategories(getAllCategories());
    };

    window.addEventListener("churraspao-catalog-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("churraspao-catalog-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const product = useMemo<LocalProduct | undefined>(() => products.find((item) => item.id === productId), [products, productId]);
  const categoryName = product ? categories.find((category) => category.id === product.categoryId)?.name : "";
  const image = product?.images?.[0]?.url;
  const promo = product && product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price ? product.promoPrice : product?.activePromo?.promoPrice;
  const unitPrice = promo ?? product?.price ?? 0;
  const total = Math.round(unitPrice * quantity * 100) / 100;

  const handleAdd = () => {
    if (!product || product.price <= 0) return;

    add({
      productId: product.id,
      productName: product.name,
      imageUrl: image,
      addonIds: [],
      addonNames: [],
      addonPrices: [],
      accompanimentSelections: [],
      quantity,
      unitPrice,
      notes: notes.trim() || undefined,
    });

    toast.success("Produto adicionado ao carrinho");
  };

  if (!Number.isFinite(productId) || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-display text-xl font-semibold">Produto não encontrado</p>
          <p className="max-w-sm text-sm text-muted-foreground">Esse item pode ter sido removido, esgotado ou ainda não está disponível no cardápio.</p>
          <Link href="/cardapio" className="font-semibold text-brand-bright hover:underline">
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/cardapio" className="-ml-2 rounded-full p-2 transition-colors hover:bg-card" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="flex-1 truncate font-display text-sm font-bold">{product.name}</p>
          <button
            onClick={() => {
              setIsFavorite((current) => !current);
              toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
            }}
            className="rounded-full p-2 transition-colors hover:bg-card"
            aria-label="Favoritar"
          >
            <Heart className={cn("h-5 w-5", isFavorite ? "fill-brand-bright text-brand-bright" : "text-muted-foreground")} />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-[#050505]">
          {image ? (
            <img src={image} alt={product.name} className="aspect-[4/3] w-full object-contain object-center p-2" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-sm font-medium text-muted-foreground">Sem foto</div>
          )}
        </div>

        <section className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {(product.salesCount ?? 0) > 0 && <Badge>Mais pedido</Badge>}
            {product.isNew && <Badge className="bg-accent">Novidade</Badge>}
            {(product.isOffer || promo) && <Badge>Oferta</Badge>}
            {product.isExclusive && <Badge className="bg-secondary">Exclusivo do app</Badge>}
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-bright">{categoryName}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>
          {product.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

          <div className="mt-4 flex items-baseline gap-3">
            {product.price <= 0 ? (
              <span className="font-display text-2xl font-bold text-brand-bright">Monte no pedido</span>
            ) : (
              <>
                <span className={cn("font-display text-3xl font-bold", promo ? "text-brand-bright" : "text-foreground")}>{formatBRL(unitPrice)}</span>
                {promo && <span className="text-sm text-muted-foreground line-through">{formatBRL(product.price)}</span>}
              </>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-base font-semibold">Observação</h2>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            placeholder="Ex: tirar cebola, maionese à parte..."
            className="mt-2 h-24 w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-brand/60"
          />
        </section>
      </main>

      {product.price > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-40 px-4 md:bottom-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-2xl shadow-black/60">
            <div className="flex items-center overflow-hidden rounded-xl border border-border">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="btn-press p-2.5 transition-colors hover:bg-secondary" aria-label="Diminuir">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 px-3 text-center font-display text-sm font-bold">{quantity}</span>
              <button onClick={() => setQuantity((value) => value + 1)} className="btn-press p-2.5 transition-colors hover:bg-secondary" aria-label="Aumentar">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAdd} className="btn-press flex-1 rounded-2xl bg-brand py-3.5 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-bright">
              Adicionar ao carrinho | {formatBRL(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
