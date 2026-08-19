import { useEffect, useMemo, useState } from "react";
import { Camera, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { formatBRL } from "@/lib/brand";
import { clearSavedProductImages, getAdminProducts, getAllCategories, publishLocalCatalogToCloud, removeLocalProduct, saveLocalProduct, type LocalProduct } from "@/lib/localCatalog";

type ProductForm = {
  id?: number;
  name: string;
  price: string;
  categoryId: string;
  shortDescription: string;
  status: "available" | "unavailable" | "soldOut";
  isFeatured: boolean;
  isOffer: boolean;
};

function emptyForm(): ProductForm {
  return {
    name: "",
    price: "",
    categoryId: "",
    shortDescription: "",
    status: "available",
    isFeatured: false,
    isOffer: false,
  };
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      image.onload = () => {
        const width = 360;
        const height = 270;
        const scale = Math.min(width / image.width, height / image.height);
        const drawWidth = Math.max(1, Math.round(image.width * scale));
        const drawHeight = Math.max(1, Math.round(image.height * scale));
        const drawX = Math.round((width - drawWidth) / 2);
        const drawY = Math.round((height - drawHeight) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Não foi possível preparar a imagem."));
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.42));
      };
      image.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminProdutos() {
  const [categories, setCategories] = useState(getAllCategories);
  const [products, setProducts] = useState(getAdminProducts);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const isEditing = form.id != null;

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  const refresh = () => {
    setCategories(getAllCategories());
    setProducts(getAdminProducts());
  };

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("churraspao-catalog-updated", onUpdate);
    return () => window.removeEventListener("churraspao-catalog-updated", onUpdate);
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setImagePreview(null);
    setError("");
  };

  const editProduct = (product: LocalProduct) => {
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price).replace(".", ","),
      categoryId: String(product.categoryId),
      shortDescription: product.shortDescription ?? "",
      status: product.status === "available" ? "available" : "soldOut",
      isFeatured: product.isFeatured,
      isOffer: product.isOffer,
    });
    setImagePreview(product.images?.[0]?.url ?? null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const categoryId = Number(form.categoryId || categories[0]?.id);
    const price = Number(form.price.replace(",", "."));
    if (!form.name.trim()) return setError("Informe o nome do produto.");
    if (!categoryId) return setError("Cadastre uma categoria antes de adicionar produtos.");
    if (Number.isNaN(price) || price < 0) return setError("Informe um preco valido.");

    setSaving(true);
    try {
      await saveLocalProduct({
        id: form.id,
        name: form.name,
        price,
        categoryId,
        shortDescription: form.shortDescription,
        imageUrl: imagePreview,
        status: form.status,
        isBestSeller: false,
        isFeatured: form.isFeatured,
        isOffer: form.isOffer,
      });
      refresh();
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nao foi possivel salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Cardápio & Produtos" subtitle="Edite os produtos do panfleto e cadastre novos itens">
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1.2fr_0.7fr_0.8fr_1fr]">
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" placeholder="Nome do produto" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" inputMode="decimal" placeholder="Preço" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <select className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
          <option value="">Categoria</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <label className="btn-press flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand/60 bg-background px-3 py-3 text-sm text-brand-bright">
          <Camera className="h-4 w-4" />
          {imagePreview ? "Trocar foto" : "Foto do produto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) return;
              setError("");
              try {
                setImagePreview(await compressImage(file));
              } catch {
                setError("Não foi possível usar essa imagem. Tente outra foto.");
              }
            }}
          />
        </label>

        <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground lg:col-span-4">
          Foto recomendada: proporção 4:3, exemplo 360x270 px. Se enviar em outro tamanho, o sistema reduz e ajusta automaticamente sem cortar a imagem.
        </div>

        <textarea className="min-h-24 rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand lg:col-span-2" placeholder="Descrição curta para aparecer no app" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} />

        <div className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm">
          <select className="rounded-lg border border-border bg-card px-3 py-2 outline-none" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProductForm["status"] })}>
            <option value="available">Disponível</option>
            <option value="soldOut">Esgotado</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> Destaque</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isOffer} onChange={(event) => setForm({ ...form, isOffer: event.target.checked })} /> Oferta</label>
        </div>

        <div className="flex flex-col gap-3">
          {imagePreview && <img src={imagePreview} alt="Prévia do produto" className="h-24 w-full rounded-xl bg-[#050505] object-contain object-center p-1" />}
          {imagePreview && (
            <button type="button" onClick={() => setImagePreview(null)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
              Remover foto
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button disabled={saving} className="btn-press inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-bright disabled:opacity-60">
              {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? "Salvando" : isEditing ? "Salvar" : "Adicionar"}
            </button>
            <button type="button" onClick={resetForm} className="btn-press inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
              Limpar
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive lg:col-span-4">{error}</p>}
      </form>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Produtos cadastrados</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={publishing}
            onClick={async () => {
              setError("");
              setPublishing(true);
              try {
                await publishLocalCatalogToCloud();
                refresh();
                setError("Catalogo publicado na nuvem. Abra o app no celular novamente para ver as fotos.");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Nao foi possivel publicar o catalogo.");
              } finally {
                setPublishing(false);
              }
            }}
            className="rounded-full border border-brand/60 px-3 py-1 text-xs font-semibold text-brand-bright transition-colors hover:bg-brand hover:text-white disabled:opacity-60"
          >
            {publishing ? "Publicando" : "Publicar catalogo"}
          </button>
          <button
            type="button"
            onClick={() => {
              clearSavedProductImages();
              setImagePreview(null);
              refresh();
              setError("Fotos antigas foram removidas. Agora escolha a foto do produto novamente e salve.");
            }}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Limpar fotos pesadas
          </button>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{products.length} itens</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const image = product.images?.[0]?.url;
          const isCustom = !product.isBase;
          return (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-[4/3] bg-[#050505]">
                {image ? <img src={image} alt={product.name} className="h-full w-full object-contain object-center p-1" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem foto</div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">{product.name}</h2>
                    <p className="mt-1 text-xs text-brand-bright">{categoryById.get(product.categoryId) ?? "Categoria"}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.shortDescription || "Sem descrição"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-secondary px-2 py-1 text-[10px] uppercase text-muted-foreground">{product.status === "available" ? "Disponivel" : "Esgotado"}</span>
                    <span className="rounded-full bg-background px-2 py-1 text-[10px] text-muted-foreground">{product.salesCount ?? 0} vendas</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <strong className="text-brand-bright">{formatBRL(Number(product.price ?? 0))}</strong>
                  <div className="flex gap-2">
                    <button onClick={() => editProduct(product)} className="btn-press inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => {
                          removeLocalProduct(product.id);
                          refresh();
                        }}
                        className="btn-press inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
}
