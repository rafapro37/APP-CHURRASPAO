import { BRAND } from "@/lib/brand";
import { MENU_CATEGORIES, MENU_PRODUCTS } from "@/lib/menuData";

const PRODUCTS_KEY = "churraspao-admin-products";
const CATEGORIES_KEY = "churraspao-admin-categories";
const LOGO_KEY = "churraspao-admin-logo";
const SALES_KEY = "churraspao-product-sales";
const PRODUCT_IMAGE_PREFIX = "churraspao-product-image:";

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

export function saveLocalProduct(input: {
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

  return withPersistentImage(product);
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
