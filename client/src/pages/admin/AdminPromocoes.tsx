import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { formatBRL } from "@/lib/brand";
import { getAdminProducts, saveLocalProduct, type LocalProduct } from "@/lib/localCatalog";

export default function AdminPromocoes() {
  const [products, setProducts] = useState(getAdminProducts);
  const [savingId, setSavingId] = useState<number | null>(null);
  const offers = products.filter((product) => product.isOffer);

  const refresh = () => setProducts(getAdminProducts());

  useEffect(() => {
    window.addEventListener("churraspao-catalog-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("churraspao-catalog-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const toggleOffer = async (product: LocalProduct) => {
    setSavingId(product.id);
    try {
      await saveLocalProduct({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        shortDescription: product.shortDescription ?? "",
        imageUrl: product.images?.[0]?.url,
        status: product.status,
        isBestSeller: false,
        isFeatured: product.isFeatured,
        isOffer: !product.isOffer,
      });
      refresh();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout title="Promocoes" subtitle="Escolha quais produtos aparecem na aba de ofertas">
      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <p className="font-display text-lg font-bold">Promocoes ativas</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {offers.length === 0 ? "Nenhum produto marcado como oferta." : `${offers.length} produto(s) em oferta no app do cliente.`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const image = product.images?.[0]?.url;
          return (
            <article key={product.id} className={`overflow-hidden rounded-2xl border bg-card ${product.isOffer ? "border-brand ember-glow" : "border-border"}`}>
              <div className="aspect-[4/3] bg-[#050505]">
                {image ? <img src={image} alt={product.name} className="h-full w-full object-contain object-center p-1" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem foto</div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">{product.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription || "Sem descricao"}</p>
                  </div>
                  {product.isOffer && <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase text-white">Oferta</span>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <strong className="text-brand-bright">{formatBRL(Number(product.price ?? 0))}</strong>
                  <button
                    disabled={savingId === product.id}
                    onClick={() => toggleOffer(product)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${product.isOffer ? "border border-border text-muted-foreground" : "bg-brand text-white hover:bg-brand-bright"}`}
                  >
                    {savingId === product.id ? "Salvando" : product.isOffer ? "Remover oferta" : "Ativar oferta"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
}
