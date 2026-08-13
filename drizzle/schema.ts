import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, double } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Cardápio
// ---------------------------------------------------------------------------

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  emoji: varchar("emoji", { length: 8 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Category = typeof categories.$inferSelect;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  categoryId: int("categoryId").notNull(),
  price: double("price").notNull(),
  promoPrice: double("promoPrice"),
  status: mysqlEnum("status", ["available", "unavailable", "soldOut"]).default("available").notNull(),
  isBestSeller: boolean("isBestSeller").default(false).notNull(),
  isNew: boolean("isNew").default(false).notNull(),
  isOffer: boolean("isOffer").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isExclusive: boolean("isExclusive").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;

export const productImages = mysqlTable("productImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductImage = typeof productImages.$inferSelect;

export const productAddons = mysqlTable("productAddons", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  price: double("price").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductAddon = typeof productAddons.$inferSelect;

export const productVariations = mysqlTable("productVariations", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  price: double("price").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductVariation = typeof productVariations.$inferSelect;

export const productAccompaniments = mysqlTable("productAccompaniments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 256 }).notNull(),
  optionsJson: json("optionsJson").$type<string[]>().notNull(),
  minSelection: int("minSelection").default(0).notNull(),
  maxSelection: int("maxSelection").default(0).notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductAccompaniment = typeof productAccompaniments.$inferSelect;

// ---------------------------------------------------------------------------
// Promoções e cupons
// ---------------------------------------------------------------------------

export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  subtitle: varchar("subtitle", { length: 256 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  productId: int("productId"),
  originalPrice: double("originalPrice"),
  promoPrice: double("promoPrice"),
  dayOfWeek: int("dayOfWeek"), // 0-6, optional
  startHour: varchar("startHour", { length: 5 }), // HH:mm, optional
  endHour: varchar("endHour", { length: 5 }), // HH:mm, optional
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Promotion = typeof promotions.$inferSelect;

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["percent", "fixed"]).default("percent").notNull(),
  value: double("value").notNull(),
  maxDiscount: double("maxDiscount"),
  minOrderValue: double("minOrderValue").default(0).notNull(),
  usageLimit: int("usageLimit"), // null = unlimited
  usedCount: int("usedCount").default(0).notNull(),
  onePerCustomer: boolean("onePerCustomer").default(true).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Coupon = typeof coupons.$inferSelect;

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export const orderStatuses = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "delivering",
  "finished",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  userId: int("userId"),
  guestName: varchar("guestName", { length: 128 }),
  customerName: varchar("customerName", { length: 128 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 32 }).notNull(),
  deliveryType: mysqlEnum("deliveryType", ["delivery", "pickup"]).default("delivery").notNull(),
  addressLine: varchar("addressLine", { length: 512 }),
  addressRef: varchar("addressRef", { length: 256 }),
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "card", "cash", "online"]).default("pix").notNull(),
  changeFor: varchar("changeFor", { length: 32 }),
  couponCode: varchar("couponCode", { length: 64 }),
  couponDiscount: double("couponDiscount").default(0).notNull(),
  subtotal: double("subtotal").notNull(),
  deliveryFee: double("deliveryFee").default(0).notNull(),
  total: double("total").notNull(),
  status: mysqlEnum("status", orderStatuses).default("new").notNull(),
  observation: text("observation"),
  itemsJson: json("itemsJson").$type<OrderItemPayload[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Order = typeof orders.$inferSelect;

/** Estrutura dos itens dentro de orders.itemsJson (payload, não FK). */
export type OrderItemPayload = {
  productId: number;
  productName: string;
  imageUrl?: string;
  variationId?: number | null;
  variationName?: string | null;
  variationPrice?: number;
  addonIds?: number[];
  addonNames?: string[];
  addonPrices?: number[];
  accompanimentSelections?: { accompanimentId: number; label: string; selected: string[] }[];
  quantity: number;
  unitPrice: number;
  notes?: string;
};

// ---------------------------------------------------------------------------
// Favoritos
// ---------------------------------------------------------------------------

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Favorite = typeof favorites.$inferSelect;
