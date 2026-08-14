import { BRAND } from "@/lib/brand";
import { MENU_CATEGORIES, MENU_PRODUCTS } from "@/lib/menuData";
import { supabase } from "@/lib/supabaseClient";

const PRODUCTS_KEY = "churraspao-admin-products";
const CATEGORIES_KEY = "churraspao-admin-categories";
const LOGO_KEY = "churraspao-admin-logo";
const SALES_KEY = "churraspao-product-sales";
const PRODUCT_IMAGE_PREFIX = "churraspao-product-image:";
const CATALOG_PRODUCTS_TABLE = "catalog_products";

export type LocalCategory = {
  id: number;
  name: string;
  sortOrder: number;
  isAvailable: boolean;
};

export type LocalProduct = {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  shortDescription: string;
  description: string;
  status: "available" | "unavailable" | "soldOut";
  isBestSeller: boolean;
  isNew: boolean;
  isOffer: boolean;
  isFeatured: boolean;
  isExclusive: boolean;
  images: { id: number; url: string; sortOrder: number }[];
  promoPrice: number | null;
  activePromo: null;
  isBase?: boolean;
  salesCount?: number;
};

type CloudProductRow = {
  id: number;
  name: string;
  category_id: number;
  price: number;
  short_description: string | null;
  description: string | null;
  status: LocalProduct["status"];
  is_offer: boolean | null;
  is_featured: boolean | null;
  is_new: boolean | null;
  is_exclusive: boolean | null;
  image_url: string | null;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("churraspao-catalog-updated"));
}

function productImageKey(id: number) {
  return `${PRODUCT_IMAGE_PREFIX}${id}`;
}

function getStoredProductImage(id: number) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(productImageKey(id));
}

function saveStoredProductImage(id: number, imageUrl: string | null | undefined) {
  if (typeof window === "undefined" || imageUrl === undefined) return;
  if (imageUrl) localStorage.setItem(productImageKey(id), imageUrl);
  else localStorage.removeItem(productImageKey(id));
}

function mapCloudProduct(row: CloudProductRow): LocalProduct {
  const imageUrl = row.image_url || null;
  if (imageUrl) saveStoredProductImage(row.id, imageUrl);

  return {
    id: Number(row.id),
    name: row.name,
    categoryId: Number(row.category_id),
    price: Number(row.price ?? 0),
    shortDescription: row.short_description ?? "",
    description: row.description ?? row.short_description ?? "",
    status: row.status ?? "available",
    isBestSeller: false,
    isNew: Boolean(row.is_new),
    isOffer: Boolean(row.is_offer),
    isFeatured: Boolean(row.is_featured),
    isExclusive: Boolean(row.is_exclusive),
    images: imageUrl ? [{ id: Number(row.id), url: imageUrl, sortOrder: 0 }] : [],
    promoPrice: null,
    activePromo: null,
    isBase: MENU_PRODUCTS.some((baseProduct) => baseProduct.id === Number(row.id)),
  };
}

function productToCloudRow(product: LocalProduct) {
  return {
    id: product.id,
    name: product.name,
    category_id: product.categoryId,
    price: product.price,
    short_description: product.shortDescription ?? "",
    description: product.description ?? product.shortDescription ?? "",
    status: product.status,
    is_offer: product.isOffer,
    is_featured: product.isFeatured,
    is_new: product.isNew,
    is_exclusive: product.isExclusive,
    image_url: product.images?.[0]?.url ?? getStoredProductImage(product.id) ?? "",
    updated_at: new Date().toISOString(),
  };
}

function withPersistentImage<T extends { id: number; images?: { id: number; url: string; sortOrder: number }[] }>(product: T): T {
  const storedImage = getStoredProductImage(product.id);
  const legacyImage = product.images?.[0]?.url ?? null;
  const image = storedImage || legacyImage;

  return {
    ...product,
    images: image ? [{ id: product.id, url: image, sortOrder: 0 }] : [],
  };
}

export function getBrandLogo() {
  if (typeof window === "undefined") return BRAND.logo;
  return localStorage.getItem(LOGO_KEY) || BRAND.logo;
}

export function saveBrandLogo(dataUrl: string) {
  localStorage.setItem(LOGO_KEY, dataUrl);
  window.dispatchEvent(new Event("churraspao-catalog-updated"));
}

export function getProductSales(): Record<number, number> {
  return readJson<Record<number, number>>(SALES_KEY, {});
}

export function registerProductSales(items: { productId: number; quantity: number }[]) {
  const sales = getProductSales();

  for (const item of items) {
    sales[item.productId] = (sales[item.productId] ?? 0) + Math.max(1, item.quantity || 1);
  }

  writeJson(SALES_KEY, sales);
}

export function registerProductSalesFromOrders(orders: { itemsJson: { productId: number; quantity: number }[] }[]) {
  const sales: Record<number, number> = {};

  for (const order of orders) {
    for (const item of order.itemsJson ?? []) {
      const productId = Number(item.productId);
      if (!productId) continue;
      sales[productId] = (sales[productId] ?? 0) + Math.max(1, Number(item.quantity ?? 1));
    }
  }

  writeJson(SALES_KEY, sales);
}

export function getLocalCategories(): LocalCategory[] {
  return readJson<LocalCategory[]>(CATEGORIES_KEY, []);
}

export function getAllCategories() {
  const base = MENU_CATEGORIES.map(({ id, name, sortOrder, isAvailable }) => ({ id, name, sortOrder, isAvailable }));
  return [...base, ...getLocalCategories()].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function saveLocalCategory(name: string) {
  const categories = getLocalCategories();
  const next: LocalCategory = {
    id: Date.now(),
    name: name.trim(),
    sortOrder: categories.length + MENU_CATEGORIES.length + 1,
    isAvailable: true,
  };
  writeJson(CATEGORIES_KEY, [...categories, next]);
  return next;
}

export function removeLocalCategory(id: number) {
  writeJson(CATEGORIES_KEY, getLocalCategories().filter((category) => category.id !== id));
}

export function getSavedProducts(): LocalProduct[] {
  const products = readJson<LocalProduct[]>(PRODUCTS_KEY, []);

  if (typeof window !== "undefined") {
    for (const product of products) {
      const legacyImage = product.images?.[0]?.url;
      if (legacyImage && !getStoredProductImage(product.id)) {
        try {
          saveStoredProductImage(product.id, legacyImage);
        } catch {
          // If storage is already full, keep going with metadata.
        }
      }
    }
  }

  return products.map((product) => ({ ...product, images: [] }));
}

export function getLocalProducts(): LocalProduct[] {
  return getSavedProducts();
}

function normalizeBaseProducts(): LocalProduct[] {
  const sales = getProductSales();

  return MENU_PRODUCTS.map((product) => ({
    ...withPersistentImage(product),
    description: product.description ?? product.shortDescription ?? "",
    shortDescription: product.shortDescription ?? "",
    status: product.status as LocalProduct["status"],
    promoPrice: product.promoPrice ?? null,
    activePromo: null,
    isBestSeller: (sales[product.id] ?? 0) > 0,
    salesCount: sales[product.id] ?? 0,
    isBase: true,
  }));
}

export function getAdminProducts(): LocalProduct[] {
  const saved = getSavedProducts();
  const sales = getProductSales();
  const savedById = new Map(saved.map((product) => [product.id, product]));
  const base = normalizeBaseProducts().map((product) => {
    const merged = withPersistentImage({ ...product, ...(savedById.get(product.id) ?? {}) });
    const salesCount = sales[merged.id] ?? 0;
    return { ...merged, salesCount, isBestSeller: salesCount > 0 };
  });
  const custom = saved.filter((product) => !MENU_PRODUCTS.some((baseProduct) => baseProduct.id === product.id));
  return [
    ...base,
    ...custom.map((product) => {
      const salesCount = sales[product.id] ?? 0;
      return { ...withPersistentImage(product), salesCount, isBestSeller: salesCount > 0 };
    }),
  ];
}

export function getAllProducts() {
  return getAdminProducts().filter((product) => product.status === "available");
}

export async function syncCatalogFromCloud() {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from(CATALOG_PRODUCTS_TABLE)
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("[Churraspao] Nao foi possivel carregar catalogo da nuvem:", error);
    return false;
  }

  if (!data?.length) return false;

  const cloudProducts = (data as CloudProductRow[]).map(mapCloudProduct);
  writeJson(
    PRODUCTS_KEY,
    cloudProducts.map((product) => ({ ...product, images: [] })),
  );

  return true;
}

export function subscribeToCatalog(onChange: () => void) {
  let channel: { subscribe: () => unknown } | null = null;
  try {
    channel =
      supabase
        ?.channel(`churraspao-catalog-realtime-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: CATALOG_PRODUCTS_TABLE }, () => {
          void syncCatalogFromCloud().finally(onChange);
        }) ?? null;
    channel?.subscribe();
  } catch (error) {
    console.warn("[Churraspao] Tempo real do catalogo indisponivel:", error);
    channel = null;
  }

  return () => {
    if (channel) void supabase?.removeChannel(channel);
  };
}

async function saveCloudProduct(product: LocalProduct) {
  if (!supabase) return;

  const { error } = await supabase
    .from(CATALOG_PRODUCTS_TABLE)
    .upsert(productToCloudRow(product), { onConflict: "id" });

  if (error) {
    console.error("[Churraspao] Nao foi possivel salvar produto na nuvem:", error);
    throw new Error("Nao foi possivel salvar o produto na nuvem. Confira a tabela catalog_products no Supabase.");
  }
}

export async function publishLocalCatalogToCloud() {
  if (!supabase) throw new Error("Supabase nao configurada.");

  const products = getAdminProducts();
  const rows = products.map(productToCloudRow);
  const { error } = await supabase.from(CATALOG_PRODUCTS_TABLE).upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("[Churraspao] Nao foi possivel publicar catalogo:", error);
    throw new Error("Nao foi possivel publicar o catalogo na nuvem.");
  }

  window.dispatchEvent(new Event("churraspao-catalog-updated"));
}

export async function saveLocalProduct(input: {
  id?: number;
  name: string;
  categoryId: number;
  price: number;
  shortDescription: string;
  imageUrl?: string | null;
  status: "available" | "unavailable" | "soldOut";
  isBestSeller: boolean;
  isFeatured: boolean;
  isOffer: boolean;
}) {
  const products = getSavedProducts();
  const id = input.id ?? Date.now();
  const existing = getAdminProducts().find((product) => product.id === id);
  const previousImage = getStoredProductImage(id) ?? existing?.images?.[0]?.url ?? null;
  const finalImage = input.imageUrl === undefined ? previousImage : input.imageUrl;
  saveStoredProductImage(id, finalImage);
  const product: LocalProduct = {
    id,
    name: input.name.trim(),
    categoryId: input.categoryId,
    price: input.price,
    shortDescription: input.shortDescription,
    description: input.shortDescription,
    status: input.status,
    isBestSeller: input.isBestSeller,
    isNew: existing?.isNew ?? false,
    isOffer: input.isOffer,
    isFeatured: input.isFeatured,
    isExclusive: existing?.isExclusive ?? false,
    images: [],
    promoPrice: null,
    activePromo: null,
    isBase: existing?.isBase,
  };
  const nextProducts = [product, ...products.filter((item) => item.id !== id)].map((item) => ({ ...item, images: [] }));
  writeJson(PRODUCTS_KEY, nextProducts);

  const savedProduct = withPersistentImage(product);
  await saveCloudProduct(savedProduct);

  return savedProduct;
}

export function removeLocalProduct(id: number) {
  if (typeof window !== "undefined") localStorage.removeItem(productImageKey(id));
  writeJson(PRODUCTS_KEY, getSavedProducts().filter((product) => product.id !== id));
}

export function clearSavedProductImages() {
  if (typeof window !== "undefined") {
    const products = getSavedProducts();
    for (const product of products) localStorage.removeItem(productImageKey(product.id));
  }

  writeJson(
    PRODUCTS_KEY,
    getSavedProducts().map((product) => ({ ...product, images: [] })),
  );
}
