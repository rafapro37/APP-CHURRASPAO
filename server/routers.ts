import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { eq } from "drizzle-orm";
import * as db from "./db";
import { orderStatuses, products, users, type OrderStatus } from "../drizzle/schema";
import { storagePut } from "./storage";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const zAccompanimentOptions = z.array(z.string().min(1));
const zAccompanimentInput = z.object({
  label: z.string().min(1),
  optionsJson: zAccompanimentOptions,
  minSelection: z.number().int().min(0).default(0),
  maxSelection: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

const productImageInput = z.object({
  base64: z.string().min(100),
  filename: z.string().max(256),
  mimeType: z.string().max(64),
  sortOrder: z.number().int().default(0),
});

async function processImage(input: { base64: string; filename: string; mimeType: string; sortOrder?: number }) {
  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.length > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Imagem muito grande (máx. 10MB)" });
  const ext = input.filename.split(".").pop()?.toLowerCase() || "jpg";
  const fileKey = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
  return { fileKey: key, url, sortOrder: input.sortOrder ?? 0 };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---------------------------------------------------------------------------
  // Público — app do cliente
  // ---------------------------------------------------------------------------
  catalog: router({
    categories: publicProcedure.query(() => db.categoryDb.list()),
    products: publicProcedure.query(() => db.productDb.listAvailable()),
    productDetail: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .query(({ input }) => db.productDb.detail(input.id)),
    activePromotions: publicProcedure.query(() => db.promotionDb.listActive()),
  }),
  favorites: router({
    list: protectedProcedure.query(({ ctx }) => db.favoriteDb.list(ctx.user.id)),
    toggle: protectedProcedure
      .input(z.object({ productId: z.number().int() }))
      .mutation(({ ctx, input }) => db.favoriteDb.toggle(ctx.user.id, input.productId)),
  }),
  coupons: router({
    redeem: publicProcedure
      .input(z.object({ code: z.string().min(1).max(64), subtotal: z.number().min(0), userId: z.number().int().nullable().optional() }))
      .mutation(({ input }) => db.couponDb.redeem(input.code, input.subtotal, input.userId ? [input.userId] : undefined)),
  }),
  orders: router({
    create: publicProcedure
      .input(
        z.object({
          guestName: z.string().max(128).optional(),
          customerName: z.string().min(1).max(128),
          customerPhone: z.string().min(1).max(32),
          deliveryType: z.enum(["delivery", "pickup"]).default("delivery"),
          addressLine: z.string().max(512).optional(),
          addressRef: z.string().max(256).optional(),
          paymentMethod: z.enum(["pix", "card", "cash", "online"]).default("pix"),
          changeFor: z.string().max(32).optional(),
          couponCode: z.string().max(64).optional(),
          subtotal: z.number().min(0),
          deliveryFee: z.number().min(0).default(0),
          observation: z.string().max(2000).optional(),
          items: z
            .array(
              z.object({
                productId: z.number().int(),
                productName: z.string(),
                imageUrl: z.string().optional(),
                variationId: z.number().int().nullable().optional(),
                variationName: z.string().nullable().optional(),
                variationPrice: z.number().optional(),
                addonIds: z.array(z.number().int()).optional(),
                addonNames: z.array(z.string()).optional(),
                addonPrices: z.array(z.number()).optional(),
                accompanimentSelections: z
                  .array(z.object({ accompanimentId: z.number().int(), label: z.string(), selected: z.array(z.string()) }))
                  .optional(),
                quantity: z.number().int().min(1),
                unitPrice: z.number().min(0),
                notes: z.string().max(500).optional(),
              }),
            )
            .min(1),
          couponPayload: z
            .object({ code: z.string().min(1), discount: z.number().min(0) })
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        const subtotal = Math.round(input.subtotal * 100) / 100;
        let couponDiscount = 0;
        let couponCode: string | null = null;
        if (input.couponPayload) {
          const redeemed = await db.couponDb.redeem(input.couponPayload.code, subtotal, userId ? [userId] : undefined);
          if (!redeemed) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom inválido, expirado ou já utilizado" });
          }
          couponDiscount = redeemed.discount;
          couponCode = redeemed.code;
        }
        const total = Math.round((subtotal - couponDiscount + input.deliveryFee) * 100) / 100;
        const order = await db.orderDb.create({
          userId,
          guestName: input.guestName ?? null,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryType: input.deliveryType,
          addressLine: input.addressLine ?? null,
          addressRef: input.addressRef ?? null,
          paymentMethod: input.paymentMethod,
          changeFor: input.changeFor ?? null,
          couponCode,
          couponDiscount,
          subtotal,
          deliveryFee: input.deliveryFee,
          total,
          observation: input.observation ?? null,
          itemsJson: input.items,
        });
        // Fidelidade: 1 ponto a cada R$ 10 gastos
        if (userId) {
          const points = Math.floor(total / 10);
          if (points > 0) {
            const d = await db.requireDb();
            const [me] = await d.select().from(users).where(eq(users.id, userId));
            if (me) {
              await d.update(users).set({ loyaltyPoints: me.loyaltyPoints + points }).where(eq(users.id, userId));
            }
          }
        }
        return order;
      }),
    myOrders: protectedProcedure.query(({ ctx }) => db.orderDb.listByUser(ctx.user.id)),
    byCode: publicProcedure.input(z.object({ code: z.string().min(1) })).query(({ input }) => db.orderDb.byCode(input.code)),
  }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => db.getUserByOpenId(ctx.user.openId)),
    update: protectedProcedure
      .input(z.object({ name: z.string().max(200).optional(), phone: z.string().max(32).optional() }))
      .mutation(async ({ ctx, input }) => {
        const d = await db.requireDb();
        await d.update(users).set(input).where(eq(users.id, ctx.user.id));
        return { success: true } as const;
      }),
  }),

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  admin: router({
    dashboard: adminProcedure.query(async () => {
      const [today, monthly, hourly, sales, categoriesList, productsList] = await Promise.all([
        db.statsDb.today(),
        db.statsDb.monthlyChart(),
        db.statsDb.hourlyChart(),
        db.productDb.countSalesAll(),
        db.categoryDb.list(),
        db.productDb.listAll(),
      ]);
      return { today, monthly, hourly, sales, categories: categoriesList, products: productsList };
    }),
    orders: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(({ input }) => db.orderDb.list(input)),
    orderStatus: adminProcedure
      .input(z.object({ id: z.number().int(), status: z.enum(orderStatuses as unknown as [string, ...string[]]) }))
      .mutation(({ input }) => db.orderDb.updateStatus(input.id, input.status as OrderStatus)),
    categories: router({
      list: adminProcedure.query(() => db.categoryDb.list()),
      create: adminProcedure
        .input(z.object({ name: z.string().min(1).max(128), emoji: z.string().max(8).optional(), sortOrder: z.number().int().optional() }))
        .mutation(({ input }) => db.categoryDb.create(input)),
      update: adminProcedure
        .input(z.object({ id: z.number().int(), name: z.string().min(1).max(128).optional(), emoji: z.string().max(8).optional(), sortOrder: z.number().int().optional(), isAvailable: z.boolean().optional() }))
        .mutation(({ input }) => db.categoryDb.update(input.id, input)),
      remove: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
        const d = await db.requireDb();
        const inUse = await d.select().from(products).where(eq(products.categoryId, input.id));
        if (inUse.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Categoria possui produtos e não pode ser excluída" });
        await db.categoryDb.remove(input.id);
      }),
      reorder: adminProcedure.input(z.object({ ids: z.array(z.number().int()) })).mutation(({ input }) => db.categoryDb.reorder(input.ids)),
    }),
    products: router({
      list: adminProcedure.query(() => db.productDb.listAll()),
      detail: adminProcedure.input(z.object({ id: z.number().int() })).query(({ input }) => db.productDb.detail(input.id)),
      sales: adminProcedure.input(z.object({ id: z.number().int() })).query(({ input }) => db.productDb.countSales(input.id)),
      create: adminProcedure
        .input(
          z.object({
            name: z.string().min(1).max(256),
            description: z.string().max(2000).optional(),
            shortDescription: z.string().max(500).optional(),
            categoryId: z.number().int(),
            price: z.number().min(0),
            promoPrice: z.number().min(0).nullable().optional(),
            status: z.enum(["available", "unavailable", "soldOut"]).default("available"),
            isBestSeller: z.boolean().default(false),
            isNew: z.boolean().default(false),
            isOffer: z.boolean().default(false),
            isFeatured: z.boolean().default(false),
            isExclusive: z.boolean().default(false),
            sortOrder: z.number().int().default(0),
          }),
        )
        .mutation(({ input }) => db.productDb.create(input)),
      update: adminProcedure
        .input(z.object({ id: z.number().int(), data: z.record(z.string(), z.any()) }))
        .mutation(({ input }) => db.productDb.update(input.id, input.data)),
      duplicate: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.productDb.duplicate(input.id)),
      remove: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.productDb.remove(input.id)),
      quickEdit: adminProcedure
        .input(
          z.object({
            id: z.number().int(),
            price: z.number().min(0).optional(),
            promoPrice: z.number().min(0).nullable().optional(),
            status: z.enum(["available", "unavailable", "soldOut"]).optional(),
            isBestSeller: z.boolean().optional(),
            isNew: z.boolean().optional(),
            isOffer: z.boolean().optional(),
            isFeatured: z.boolean().optional(),
            isExclusive: z.boolean().optional(),
          }),
        )
        .mutation(({ input }) => {
          const { id, ...data } = input;
          return db.productDb.update(id, data);
        }),
      images: router({
        add: adminProcedure
          .input(z.object({ productId: z.number().int(), images: z.array(productImageInput).min(1).max(6) }))
          .mutation(async ({ input }) => {
            const imgs = await Promise.all(input.images.map(processImage));
            await db.productDb.addImages(input.productId, imgs);
            return imgs;
          }),
        remove: adminProcedure.input(z.object({ ids: z.array(z.number().int()).min(1) })).mutation(({ input }) => db.productDb.removeImages(input.ids)),
      }),
      addons: adminProcedure
        .input(
          z.object({
            productId: z.number().int(),
            addons: z.array(z.object({ name: z.string().min(1).max(128), price: z.number().min(0), isAvailable: z.boolean().default(true) })),
          }),
        )
        .mutation(({ input }) => db.productDb.setAddons(input.productId, input.addons)),
      variations: adminProcedure
        .input(
          z.object({
            productId: z.number().int(),
            variations: z.array(
              z.object({ name: z.string().min(1).max(128), price: z.number().min(0), isDefault: z.boolean().default(false), isAvailable: z.boolean().default(true) }),
            ),
          }),
        )
        .mutation(({ input }) => db.productDb.setVariations(input.productId, input.variations)),
      accompaniments: adminProcedure
        .input(z.object({ productId: z.number().int(), accompaniments: z.array(zAccompanimentInput) }))
        .mutation(({ input }) => db.productDb.setAccompaniments(input.productId, input.accompaniments)),
    }),
    promotions: router({
      list: adminProcedure.query(() => db.promotionDb.list()),
      create: adminProcedure
        .input(
          z.object({
            title: z.string().min(1).max(256),
            subtitle: z.string().max(256).optional(),
            imageUrl: z.string().max(512).optional(),
            productId: z.number().int().nullable().optional(),
            originalPrice: z.number().min(0).nullable().optional(),
            promoPrice: z.number().min(0).nullable().optional(),
            dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
            startHour: z.string().max(5).optional(),
            endHour: z.string().max(5).optional(),
            startDate: z.date().nullable().optional(),
            endDate: z.date().nullable().optional(),
            isAvailable: z.boolean().default(true),
          }),
        )
        .mutation(({ input }) => db.promotionDb.create(input)),
      update: adminProcedure.input(z.object({ id: z.number().int(), data: z.record(z.string(), z.any()) })).mutation(({ input }) => db.promotionDb.update(input.id, input.data)),
      remove: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.promotionDb.remove(input.id)),
    }),
    coupons: router({
      list: adminProcedure.query(() => db.couponDb.list()),
      create: adminProcedure
        .input(
          z.object({
            code: z.string().min(2).max(64),
            type: z.enum(["percent", "fixed"]),
            value: z.number().min(0),
            maxDiscount: z.number().min(0).nullable().optional(),
            minOrderValue: z.number().min(0).default(0),
            usageLimit: z.number().int().min(1).nullable().optional(),
            onePerCustomer: z.boolean().default(true),
            isAvailable: z.boolean().default(true),
          }),
        )
        .mutation(({ input }) => db.couponDb.create({ ...input, code: input.code.trim().toUpperCase() })),
      update: adminProcedure.input(z.object({ id: z.number().int(), data: z.record(z.string(), z.any()) })).mutation(({ input }) => db.couponDb.update(input.id, input.data)),
      remove: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => db.couponDb.remove(input.id)),
    }),
    customers: router({
      list: adminProcedure.query(() => db.customerDb.list()),
      orders: adminProcedure.input(z.object({ userId: z.number().int() })).query(({ input }) => db.customerDb.orderHistory(input.userId)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
