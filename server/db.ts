import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  categories,
  coupons,
  favorites,
  Order,
  orderStatuses,
  orders,
  productAccompaniments,
  productAddons,
  productImages,
  products,
  productVariations,
  promotions,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/** Require the db or throw — makes TS happy in write helpers. */
export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      const value = user[field];
      if (value === undefined) continue;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    values.lastSignedIn = user.lastSignedIn ?? new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

export const categoryDb = {
  async list() {
    const db = await requireDb();
    return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  },
  async create(data: { name: string; emoji?: string | null; sortOrder?: number }) {
    const db = await requireDb();
    const result = await db.insert(categories).values({ ...data, sortOrder: data.sortOrder ?? 0 });
    return result[0].insertId;
  },
  async update(id: number, data: Partial<{ name: string; emoji: string | null; sortOrder: number; isAvailable: boolean }>) {
    const db = await requireDb();
    await db.update(categories).set(data).where(eq(categories.id, id));
  },
  async remove(id: number) {
    const db = await requireDb();
    await db.delete(categories).where(eq(categories.id, id));
  },
  async reorder(ids: number[]) {
    const db = await requireDb();
    await Promise.all(ids.map((id, idx) => db.update(categories).set({ sortOrder: idx }).where(eq(categories.id, id))));
  },
};

// ---------------------------------------------------------------------------
// Produtos + imagens + adicionais + variações + acompanhamentos
// ---------------------------------------------------------------------------

export const productDb = {
  async listAvailable() {
    const db = await requireDb();
    const now = new Date();
    const visible = await db
      .select()
      .from(products)
      .where(
        and(eq(products.status, "available"), gte(products.price, 0)),
      )
      .orderBy(asc(products.sortOrder), asc(products.id));
    const productsWithImgs = await Promise.all(visible.map((p) => productDb.detail(p.id, now)));
    return productsWithImgs.filter((p): p is NonNullable<typeof p> => p !== null);
  },
  async listAll() {
    const db = await requireDb();
    const rows = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id));
    const withDetails = await Promise.all(rows.map((product) => productDb.detail(product.id)));
    return withDetails.filter((product): product is NonNullable<typeof product> => product !== null);
  },
  async detail(id: number, now?: Date) {
    const db = await requireDb();
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return null;
    const [images, addons, variations, accompaniments] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.sortOrder)),
      db.select().from(productAddons).where(and(eq(productAddons.productId, id), eq(productAddons.isAvailable, true))),
      db.select().from(productVariations).where(eq(productVariations.productId, id)),
      db.select().from(productAccompaniments).where(and(eq(productAccompaniments.productId, id), eq(productAccompaniments.isAvailable, true))),
    ]);
    const activePromo = await getActivePromoForProduct(id, now ?? new Date());
    return { ...product, images, addons, variations, accompaniments, activePromo };
  },
  async create(data: {
    name: string;
    description?: string | null;
    shortDescription?: string | null;
    categoryId: number;
    price: number;
    promoPrice?: number | null;
    status?: "available" | "unavailable" | "soldOut";
    isBestSeller?: boolean;
    isNew?: boolean;
    isOffer?: boolean;
    isFeatured?: boolean;
    isExclusive?: boolean;
    sortOrder?: number;
  }) {
    const db = await requireDb();
    const result = await db.insert(products).values({ ...data, sortOrder: data.sortOrder ?? 0 });
    return result[0].insertId;
  },
  async update(id: number, data: Record<string, unknown>) {
    const db = await requireDb();
    await db.update(products).set(data).where(eq(products.id, id));
  },
  async remove(id: number) {
    const db = await requireDb();
    await db.delete(productAccompaniments).where(eq(productAccompaniments.productId, id));
    await db.delete(productAddons).where(eq(productAddons.productId, id));
    await db.delete(productVariations).where(eq(productVariations.productId, id));
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
  },
  async duplicate(id: number) {
    const db = await requireDb();
    const [original] = await db.select().from(products).where(eq(products.id, id));
    if (!original) return null;
    const { id: _omit, createdAt, updatedAt, ...rest } = original;
    const insert = { ...rest, name: `${rest.name} (cópia)` };
    const result = await db.insert(products).values(insert);
    const newId = result[0].insertId;
    const [images, addons, variations, accompaniments] = await Promise.all([
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
      db.select().from(productAddons).where(eq(productAddons.productId, id)),
      db.select().from(productVariations).where(eq(productVariations.productId, id)),
      db.select().from(productAccompaniments).where(eq(productAccompaniments.productId, id)),
    ]);
    if (images.length) await db.insert(productImages).values(images.map((i) => ({ productId: newId, url: i.url, fileKey: i.fileKey, sortOrder: i.sortOrder })));
    if (addons.length) await db.insert(productAddons).values(addons.map((a) => ({ productId: newId, name: a.name, price: a.price, isAvailable: a.isAvailable })));
    if (variations.length) await db.insert(productVariations).values(variations.map((v) => ({ productId: newId, name: v.name, price: v.price, isDefault: false, isAvailable: v.isAvailable })));
    if (accompaniments.length) await db.insert(productAccompaniments).values(accompaniments.map((a) => ({ productId: newId, label: a.label, optionsJson: a.optionsJson, minSelection: a.minSelection, maxSelection: a.maxSelection, isRequired: a.isRequired, isAvailable: a.isAvailable })));
    return newId;
  },
  async addImages(productId: number, imgs: { url: string; fileKey: string; sortOrder?: number }[]) {
    const db = await requireDb();
    await db.insert(productImages).values(imgs.map((i) => ({ productId, url: i.url, fileKey: i.fileKey, sortOrder: i.sortOrder ?? 0 })));
  },
  async removeImages(ids: number[]) {
    const db = await requireDb();
    if (!ids.length) return;
    await db.delete(productImages).where(inArray(productImages.id, ids));
  },
  async setAddons(productId: number, addons: { name: string; price: number; isAvailable?: boolean }[]) {
    const db = await requireDb();
    await db.delete(productAddons).where(eq(productAddons.productId, productId));
    if (addons.length) {
      await db.insert(productAddons).values(addons.map((a) => ({ productId, name: a.name, price: a.price, isAvailable: a.isAvailable ?? true })));
    }
  },
  async setVariations(productId: number, variations: { name: string; price: number; isDefault?: boolean; isAvailable?: boolean }[]) {
    const db = await requireDb();
    await db.delete(productVariations).where(eq(productVariations.productId, productId));
    if (variations.length) {
      await db.insert(productVariations).values(
        variations.map((v, idx) => ({
          productId,
          name: v.name,
          price: v.price,
          isDefault: v.isDefault ?? idx === 0,
          isAvailable: v.isAvailable ?? true,
        })),
      );
    }
  },
  async setAccompaniments(
    productId: number,
    accomp: { label: string; optionsJson: string[]; minSelection?: number; maxSelection?: number; isRequired?: boolean; isAvailable?: boolean }[],
  ) {
    const db = await requireDb();
    await db.delete(productAccompaniments).where(eq(productAccompaniments.productId, productId));
    if (accomp.length) {
      await db.insert(productAccompaniments).values(
        accomp.map((a) => ({
          productId,
          label: a.label,
          optionsJson: a.optionsJson,
          minSelection: a.minSelection ?? 0,
          maxSelection: a.maxSelection ?? 0,
          isRequired: a.isRequired ?? false,
          isAvailable: a.isAvailable ?? true,
        })),
      );
    }
  },
  async countSales(id: number) {
    const db = await requireDb();
    const rows = (await db
      .select({ n: sql`SUM(JSON_EXTRACT(orders.itemsJson, '$**.productId'))` })
      .from(orders)
      .where(and(eq(orders.status, "finished"), sql`JSON_SEARCH(orders.itemsJson, 'one', ${id}) IS NOT NULL`))) as { n: string | null }[];
    const raw = rows[0]?.n;
    return raw ? Number(raw) : 0;
  },
  async countSalesAll() {
    const db = await requireDb();
    const rows = await db
      .select({
        productId: sql<number>`CAST(JSON_EXTRACT(orders.itemsJson, '$[*].productId') AS UNSIGNED)`,
        qty: sql<number>`SUM(CAST(JSON_EXTRACT(orders.itemsJson, '$[*].quantity') AS UNSIGNED))`,
      })
      .from(orders)
      .where(eq(orders.status, "finished"))
      .groupBy(sql`productId`);
    return rows.map((r) => ({ productId: Number(r.productId), qty: Number(r.qty ?? 0) }));
  },
};

// ---------------------------------------------------------------------------
// Promoções — ativação automática conforme agendamento
// ---------------------------------------------------------------------------

/** Verifica a janela temporal da promoção (data, dia da semana e horário). */
export type PromotionSchedule = {
  startDate: Date | null;
  endDate: Date | null;
  dayOfWeek: number | null;
  startHour: string | null;
  endHour: string | null;
  isAvailable: boolean;
};

export function isPromotionActiveNow(p: PromotionSchedule, now: Date = new Date()): boolean {
  if (!p.isAvailable) return false;
  if (p.startDate && now < p.startDate) return false;
  if (p.endDate && now > p.endDate) return false;
    const dow = typeof p.dayOfWeek === "number" ? p.dayOfWeek : null;
    const sh = p.startHour ?? null;
    const eh = p.endHour ?? null;
    if (dow !== null && dow >= 0 && dow <= 6 && now.getDay() !== dow) return false;
    if (sh || eh) {
      const minutes = now.getHours() * 60 + now.getMinutes();
      const toMin = (spec: string | null) => {
        if (!spec) return null;
        const [hh, mm] = spec.split(":").map(Number);
        return (hh || 0) * 60 + (mm || 0);
      };
      const start = toMin(sh);
      const end = toMin(eh);
      if (start !== null && minutes < start) return false;
      if (end !== null && minutes > end) return false;
    }
    return true;
}

async function getActivePromoForProduct(productId: number, now: Date) {
  const db = await requireDb();
  const rows = await db.select().from(promotions).where(eq(promotions.productId, productId));
  const active = rows.find((p) => isPromotionActiveNow(p, now));
  return active ?? null;
}

export const promotionDb = {
  async list(now?: Date) {
    const db = await requireDb();
    const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    return rows.map((p) => ({ ...p, isActiveNow: isPromotionActiveNow(p, now ?? new Date()) }));
  },
  async listActive(now?: Date) {
    const db = await requireDb();
    const rows = await db.select().from(promotions).where(eq(promotions.isAvailable, true));
    return rows.filter((p) => isPromotionActiveNow(p, now ?? new Date()));
  },
  async create(data: Record<string, unknown>) {
    const db = await requireDb();
    const result = await db.insert(promotions).values(data as never);
    return result[0].insertId;
  },
  async update(id: number, data: Record<string, unknown>) {
    const db = await requireDb();
    await db.update(promotions).set(data).where(eq(promotions.id, id));
  },
  async remove(id: number) {
    const db = await requireDb();
    await db.delete(promotions).where(eq(promotions.id, id));
  },
};

// ---------------------------------------------------------------------------
// Cupons
// ---------------------------------------------------------------------------

export const couponDb = {
  async list() {
    const db = await requireDb();
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  },
  /** Valida o cupom; incrementa o contador de uso e retorna o desconto (em reais). */
  async redeem(code: string, subtotal: number, usedByCustomerIds?: number[]) {
    const db = await requireDb();
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.trim().toUpperCase()));
    if (!coupon || !coupon.isAvailable) return null;
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return null;
    if (subtotal < coupon.minOrderValue) return null;
    let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    if (discount <= 0) return null;
    if (coupon.onePerCustomer && usedByCustomerIds?.length) {
      const alreadyUsed = await db.select().from(orders).where(and(eq(orders.couponCode, coupon.code), inArray(orders.userId!, usedByCustomerIds)));
      if (alreadyUsed.length) return null;
    }
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon.id));
    return { code: coupon.code, discount: Math.round(discount * 100) / 100 };
  },
  async create(data: Record<string, unknown>) {
    const db = await requireDb();
    const result = await db.insert(coupons).values(data as never);
    return result[0].insertId;
  },
  async update(id: number, data: Record<string, unknown>) {
    const db = await requireDb();
    await db.update(coupons).set(data).where(eq(coupons.id, id));
  },
  async remove(id: number) {
    const db = await requireDb();
    await db.delete(coupons).where(eq(coupons.id, id));
  },
};

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export const orderDb = {
  async create(data: {
    userId?: number | null;
    guestName?: string | null;
    customerName: string;
    customerPhone: string;
    deliveryType?: "delivery" | "pickup";
    addressLine?: string | null;
    addressRef?: string | null;
    paymentMethod?: "pix" | "card" | "cash" | "online";
    changeFor?: string | null;
    couponCode?: string | null;
    couponDiscount?: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
    observation?: string | null;
    itemsJson: Order["itemsJson"];
  }) {
    const db = await requireDb();
    const code = `C${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90) + 10}`;
    const result = await db.insert(orders).values({ ...data, status: "new", code });
    return { id: result[0].insertId, code };
  },
  async list(filter?: { status?: string }) {
    const db = await requireDb();
    const where = filter?.status ? and(eq(orders.status, filter.status as never)) : undefined;
    return db.select().from(orders).where(where).orderBy(desc(orders.createdAt));
  },
  async listByUser(userId: number) {
    const db = await requireDb();
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  },
  async byCode(code: string) {
    const db = await requireDb();
    const [row] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
    return row ?? null;
  },
  async byId(id: number) {
    const db = await requireDb();
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row ?? null;
  },
  async updateStatus(id: number, status: Order["status"]) {
    const db = await requireDb();
    await db.update(orders).set({ status }).where(eq(orders.id, id));
  },
  async markDelivered(id: number) {
    const db = await requireDb();
    await db.update(orders).set({ status: "finished" }).where(eq(orders.id, id));
  },
};

// ---------------------------------------------------------------------------
// Dashboard / relatórios
// ---------------------------------------------------------------------------

export const statsDb = {
  async today(now: Date = new Date()) {
    const db = await requireDb();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const active = await db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "finished"), gte(orders.createdAt, start)));
    const revenue = active.reduce((sum, o) => sum + Number(o.total), 0);
    const preparing = await db
      .select({ id: orders.id })
      .from(orders)
      .where(inArray(orders.status, ["accepted", "preparing", "ready", "delivering"]));
    const newOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "new"));
    return {
      revenue: Math.round(revenue * 100) / 100,
      ordersCount: active.length,
      avgTicket: active.length ? Math.round((revenue / active.length) * 100) / 100 : 0,
      preparing: preparing.length,
      newOrders: newOrders.length,
    };
  },
  async monthlyChart(now: Date = new Date()) {
    const db = await requireDb();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = await db
      .select({
        day: sql<string>`DATE(orders.createdAt)`,
        total: sql<number>`SUM(orders.total)`,
        qty: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "finished"), gte(orders.createdAt, start)))
      .groupBy(sql`DATE(orders.createdAt)`);
    return rows.map((r) => ({ day: r.day, total: Number(r.total ?? 0), qty: Number(r.qty ?? 0) }));
  },
  async hourlyChart(now: Date = new Date()) {
    const db = await requireDb();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rows = await db
      .select({
        hour: sql<string>`HOUR(orders.createdAt)`,
        total: sql<number>`SUM(orders.total)`,
        qty: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "finished"), gte(orders.createdAt, start)))
      .groupBy(sql`HOUR(orders.createdAt)`);
    return rows.map((r) => ({ hour: Number(r.hour), total: Number(r.total ?? 0), qty: Number(r.qty ?? 0) }));
  },
};

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------

export const favoriteDb = {
  async list(userId: number) {
    const db = await requireDb();
    return db.select().from(favorites).where(eq(favorites.userId, userId));
  },
  async toggle(userId: number, productId: number) {
    const db = await requireDb();
    const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return false;
    }
    await db.insert(favorites).values({ userId, productId });
    return true;
  },
};

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export const customerDb = {
  async list() {
    const db = await requireDb();
    return db.select().from(users).orderBy(desc(users.createdAt));
  },
  async orderHistory(userId: number) {
    const db = await requireDb();
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  },
};
