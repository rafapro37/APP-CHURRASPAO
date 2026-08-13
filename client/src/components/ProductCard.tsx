import { Link } from "wouter";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/brand";

export type ProductSummary = {
  id: number;
  name: string;
  categoryId?: number;
  shortDescription?: string | null;
  images?: { id: number; url: string; sortOrder: number }[];
  price: number;
  promoPrice?: number | null;
  status: string;
  isBestSeller: boolean;
  isNew: boolean;
  isOffer: boolean;
  isFeatured: boolean;
  isExclusive: boolean;
  salesCount?: number;
  activePromo?: { id: number; promoPrice: number | null } | null;
};

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white", className)}>{children}</span>;
}

function NoPhoto() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#050505] text-xs font-medium text-muted-foreground">
      Sem foto
    </div>
  );
}

export function ProductCard({ product, onAdd }: { product: ProductSummary; onAdd?: (p: ProductSummary) => void }) {
  const img = product.images?.[0]?.url;
  const promo = product.promoPrice != null && product.promoPrice > 0 && product.promoPrice < product.price ? product.promoPrice : product.activePromo?.promoPrice;
  const showStrike = !!promo;
  const showBestSeller = (product.salesCount ?? 0) > 0;

  return (
    <div className="group flex min-h-[292px] flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-brand/50 hover:shadow-[0_8px_30px_rgba(217,101,8,0.16)]">
      <Link href={`/produto/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-[#050505]">
        {img ? (
          <img src={img} alt={product.name} className="h-full w-full object-contain object-center p-1" loading="lazy" />
        ) : (
          <NoPhoto />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {showBestSeller && <Badge>Mais pedido</Badge>}
          {product.isNew && <Badge className="bg-accent">Novidade</Badge>}
          {(product.isOffer || promo) && <Badge>Oferta</Badge>}
          {product.isExclusive && <Badge className="bg-secondary">Exclusivo</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <Link href={`/produto/${product.id}`}>
          <h3 className="font-display text-base font-semibold leading-tight">{product.name}</h3>
          {product.shortDescription && <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{product.shortDescription}</p>}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.price <= 0 ? (
              <span className="font-display text-base font-bold text-brand-bright">Monte no pedido</span>
            ) : (
              <>
                {showStrike && <span className="block text-[11px] text-muted-foreground line-through">{formatBRL(product.price)}</span>}
                <span className={cn("font-display text-lg font-bold", promo ? "text-brand-bright" : "text-foreground")}>{formatBRL(promo ?? product.price)}</span>
              </>
            )}
          </div>
          {onAdd && product.price > 0 && (
            <button onClick={() => onAdd(product)} className="btn-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand-bright" aria-label={`Adicionar ${product.name}`}>
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
