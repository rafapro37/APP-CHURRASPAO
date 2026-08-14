import type { CartItem } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabaseClient";

const ORDERS_KEY = "churraspao-local-orders";
const MY_ORDER_CODES_KEY = "churraspao-my-order-codes";

export type LocalOrderStatus = "new" | "accepted" | "preparing" | "ready" | "delivering" | "finished" | "cancelled";

export type LocalOrderItem = {
  productId: number;
  productName: string;
  imageUrl?: string;
  variationId?: number | null;
  variationName?: string | null;
  variationPrice?: number;
  addonIds: number[];
  addonNames: string[];
  addonPrices: number[];
  accompanimentSelections: CartItem["accompanimentSelections"];
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type LocalOrder = {
  id: number | string;
  code: string;
  status: LocalOrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryType: "delivery" | "pickup";
  addressLine?: string;
  addressRef?: string;
  paymentMethod: "pix" | "card" | "cash" | "online";
  changeFor?: string;
  observation?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  itemsJson: LocalOrderItem[];
};

function itemGroupKey(item: LocalOrderItem) {
  return JSON.stringify({
    productId: item.productId,
    productName: item.productName,
    imageUrl: item.imageUrl ?? "",
    variationId: item.variationId ?? null,
    variationName: item.variationName ?? null,
    variationPrice: Number(item.variationPrice ?? 0),
    unitPrice: Number(item.unitPrice ?? 0),
    notes: item.notes?.trim() ?? "",
    addonIds: item.addonIds ?? [],
    addonNames: item.addonNames ?? [],
    addonPrices: item.addonPrices ?? [],
    accompanimentSelections: item.accompanimentSelections ?? [],
  });
}

export function groupOrderItems(items: LocalOrderItem[] = []) {
  const grouped = new Map<string, LocalOrderItem>();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const quantity = Math.max(1, Number(item.quantity ?? 1));
    const normalized: LocalOrderItem = {
      ...item,
      productId: Number(item.productId ?? 0),
      productName: String(item.productName ?? "Produto"),
      imageUrl: item.imageUrl,
      variationId: item.variationId ?? null,
      variationName: item.variationName ?? null,
      variationPrice: Number(item.variationPrice ?? 0),
      addonIds: item.addonIds ?? [],
      addonNames: item.addonNames ?? [],
      addonPrices: item.addonPrices ?? [],
      accompanimentSelections: item.accompanimentSelections ?? [],
      quantity,
      unitPrice: Number(item.unitPrice ?? 0),
    };
    const key = itemGroupKey(normalized);
    const existing = grouped.get(key);

    if (existing) {
      grouped.set(key, { ...existing, quantity: existing.quantity + quantity });
    } else {
      grouped.set(key, normalized);
    }
  }

  return Array.from(grouped.values());
}

function readOrders(): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const orders = raw ? (JSON.parse(raw) as Partial<LocalOrder>[]) : [];
    return orders.map((order) => {
      const legacyItems = (order as Partial<LocalOrder> & { items?: LocalOrderItem[] }).items;
      const rawItems = Array.isArray(order.itemsJson) ? order.itemsJson : Array.isArray(legacyItems) ? legacyItems : [];

      return {
        id: Number(order.id ?? Date.now()),
        code: String(order.code ?? makeCode()),
        status: (order.status ?? "new") as LocalOrderStatus,
        customerName: String(order.customerName ?? "Cliente"),
        customerPhone: String(order.customerPhone ?? ""),
        deliveryType: (order.deliveryType ?? "pickup") as LocalOrder["deliveryType"],
        addressLine: order.addressLine,
        addressRef: order.addressRef,
        paymentMethod: (order.paymentMethod ?? "pix") as LocalOrder["paymentMethod"],
        changeFor: order.changeFor,
        observation: order.observation,
        subtotal: Number(order.subtotal ?? 0),
        deliveryFee: Number(order.deliveryFee ?? 0),
        total: Number(order.total ?? 0),
        createdAt: String(order.createdAt ?? new Date().toISOString()),
        itemsJson: groupOrderItems(rawItems),
      };
    });
  } catch {
    return [];
  }
}

function writeOrders(orders: LocalOrder[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("churraspao-orders-updated"));
}

function readMyOrderCodes() {
  if (typeof window === "undefined") return [];
  try {
    const codes = JSON.parse(localStorage.getItem(MY_ORDER_CODES_KEY) ?? "[]") as string[];
    return Array.from(new Set(codes.filter(Boolean)));
  } catch {
    return [];
  }
}

function rememberMyOrderCode(code: string) {
  if (typeof window === "undefined" || !code) return;
  const codes = readMyOrderCodes().filter((item) => item !== code);
  localStorage.setItem(MY_ORDER_CODES_KEY, JSON.stringify([code, ...codes].slice(0, 50)));
}

function makeCode() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CHU-${Date.now().toString().slice(-5)}-${suffix}`;
}

type OrderInput = Omit<LocalOrder, "id" | "code" | "status" | "createdAt">;

function normalizeStatus(status: unknown): LocalOrderStatus {
  const value = String(status ?? "new").toLowerCase();
  if (value === "novo pedido" || value === "novo") return "new";
  if (value === "aceito") return "accepted";
  if (value === "em preparo") return "preparing";
  if (value === "pronto") return "ready";
  if (value === "saiu para entrega") return "delivering";
  if (value === "entregue" || value === "finalizado") return "finished";
  if (value === "cancelado") return "cancelled";
  if (["new", "accepted", "preparing", "ready", "delivering", "finished", "cancelled"].includes(value)) {
    return value as LocalOrderStatus;
  }
  return "new";
}

function normalizePayment(payment: unknown): LocalOrder["paymentMethod"] {
  const value = String(payment ?? "pix").toLowerCase();
  if (value.includes("cart") || value === "card") return "card";
  if (value.includes("dinheiro") || value === "cash") return "cash";
  if (value.includes("online")) return "online";
  return "pix";
}

function mapSupabaseOrder(row: any): LocalOrder {
  const rawItems = Array.isArray(row?.items) ? row.items : [];
  const fulfillment = String(row?.fulfillment ?? row?.delivery_type ?? "delivery").toLowerCase();

  return {
    id: row?.id ?? Date.now(),
    code: String(row?.public_code ?? row?.code ?? makeCode()),
    status: normalizeStatus(row?.status),
    customerName: String(row?.customer ?? row?.customer_name ?? "Cliente"),
    customerPhone: String(row?.phone ?? row?.customer_phone ?? ""),
    deliveryType: fulfillment.includes("retirada") || fulfillment.includes("pickup") ? "pickup" : "delivery",
    addressLine: row?.address ?? row?.address_line ?? undefined,
    addressRef: row?.address_ref ?? undefined,
    paymentMethod: normalizePayment(row?.payment ?? row?.payment_method),
    changeFor: row?.change_for ?? undefined,
    observation: row?.observation ?? undefined,
    subtotal: Number(row?.subtotal ?? 0),
    deliveryFee: Number(row?.delivery_fee ?? 0),
    total: Number(row?.total ?? 0),
    createdAt: String(row?.created_at ?? new Date().toISOString()),
    itemsJson: groupOrderItems(rawItems),
  };
}

function dispatchOrderUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("churraspao-orders-updated"));
  }
}

export function createLocalOrder(input: OrderInput) {
  const order: LocalOrder = {
    ...input,
    itemsJson: groupOrderItems(input.itemsJson),
    id: Date.now(),
    code: makeCode(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  writeOrders([order, ...readOrders()]);
  rememberMyOrderCode(order.code);
  return order;
}

export async function createOrder(input: OrderInput) {
  if (!supabase) {
    throw new Error("Supabase nao configurada. Confira as variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.");
  }

  const code = makeCode();
  const payload = {
    public_code: code,
    customer: input.customerName,
    phone: input.customerPhone,
    fulfillment: input.deliveryType,
    address: input.addressLine ?? "",
    address_ref: input.addressRef ?? "",
    payment: input.paymentMethod,
    change_for: input.changeFor ?? "",
    observation: input.observation ?? "",
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    status: "new",
    items: groupOrderItems(input.itemsJson),
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();

  if (error) {
    console.error("[Churraspao] A Supabase recusou o pedido:", error);
    throw new Error([error.message, error.details, error.hint, error.code].filter(Boolean).join(" | ") || "Nao foi possivel salvar o pedido online.");
  }

  const order = mapSupabaseOrder(data);
  rememberMyOrderCode(order.code);
  dispatchOrderUpdate();
  return order;
}

export function getLocalOrders() {
  return readOrders();
}

export async function getOrders() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Churraspao] Nao foi possivel carregar pedidos da Supabase:", error);
    return [];
  }

  return (data ?? []).map(mapSupabaseOrder);
}

export async function getMyOrders() {
  const codes = readMyOrderCodes();
  if (codes.length === 0) return [];

  if (!supabase) {
    const localOrders = readOrders();
    return localOrders.filter((order) => codes.includes(order.code));
  }

  const { data, error } = await supabase.from("orders").select("*").in("public_code", codes).order("created_at", { ascending: false });
  if (error) {
    console.error("[Churraspao] Nao foi possivel carregar meus pedidos:", error);
    return readOrders().filter((order) => codes.includes(order.code));
  }

  return (data ?? []).map(mapSupabaseOrder);
}

export function getLocalOrderByCode(code: string) {
  return readOrders().find((order) => order.code === code) ?? null;
}

export async function getOrderByCode(code: string) {
  if (!supabase) return getLocalOrderByCode(code);

  const { data, error } = await supabase.from("orders").select("*").eq("public_code", code).maybeSingle();
  if (error) {
    console.error("[Churraspao] Nao foi possivel carregar pedido da Supabase:", error);
    return getLocalOrderByCode(code);
  }

  return data ? mapSupabaseOrder(data) : getLocalOrderByCode(code);
}

export function updateLocalOrderStatus(id: number | string, status: LocalOrderStatus) {
  writeOrders(readOrders().map((order) => (order.id === id ? { ...order, status } : order)));
}

export async function updateOrderStatus(id: number | string, status: LocalOrderStatus) {
  if (!supabase) {
    updateLocalOrderStatus(id, status);
    return;
  }

  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) {
    console.error("[Churraspao] Nao foi possivel atualizar status na Supabase:", error);
    updateLocalOrderStatus(id, status);
  }
  if (!error && status === "ready") {
    void fetch("/api/send-ready-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    }).catch((pushError) => {
      console.warn("[Churraspao] Pedido pronto, mas push externo nao foi enviado:", pushError);
    });
  }
  dispatchOrderUpdate();
}

export function subscribeToOrders(onChange: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener("churraspao-orders-updated", onChange);
    window.addEventListener("storage", onChange);
  }

  const channel = supabase
    ?.channel("churraspao-orders-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, onChange)
    .subscribe();

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("churraspao-orders-updated", onChange);
      window.removeEventListener("storage", onChange);
    }
    if (channel) {
      void supabase?.removeChannel(channel);
    }
  };
}

export function subscribeToReadyOrderAlerts(onReady: (order: LocalOrder) => void) {
  let knownReadyCodes = new Set<string>();
  let started = false;

  const check = async () => {
    const orders = await getOrders();
    const readyOrders = orders.filter((order) => order.status === "ready");
    const nextReadyCodes = new Set(readyOrders.map((order) => order.code));

    if (started) {
      for (const order of readyOrders) {
        if (!knownReadyCodes.has(order.code)) onReady(order);
      }
    }

    knownReadyCodes = nextReadyCodes;
    started = true;
  };

  void check();
  const unsubscribe = subscribeToOrders(check);
  return unsubscribe;
}
