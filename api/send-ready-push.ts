import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

type PushSubscriptionRow = {
  order_code: string;
  endpoint: string;
  subscription_json: webpush.PushSubscription;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:contato@churraspaoecia.com";

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function isReady() {
  return Boolean(supabase && vapidPublicKey && vapidPrivateKey);
}

function getBody(req: ApiRequest) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return (req.body ?? {}) as Record<string, unknown>;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo nao permitido" });
    return;
  }

  if (!isReady() || !supabase) {
    res.status(200).json({ ok: false, message: "Push ainda nao configurado na Vercel" });
    return;
  }

  const body = getBody(req);
  const orderId = body.orderId;
  const orderCodeFromBody = typeof body.orderCode === "string" ? body.orderCode : "";

  let orderCode = orderCodeFromBody;
  let customer = "Cliente";

  if (!orderCode && orderId) {
    const { data, error } = await supabase.from("orders").select("public_code, customer").eq("id", orderId).maybeSingle();
    if (!error && data) {
      orderCode = String(data.public_code ?? "");
      customer = String(data.customer ?? "Cliente");
    }
  }

  if (!orderCode) {
    res.status(400).json({ error: "Pedido sem codigo" });
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("order_code, endpoint, subscription_json")
    .eq("order_code", orderCode);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const rows = (subscriptions ?? []) as PushSubscriptionRow[];
  const payload = JSON.stringify({
    title: "Seu pedido está pronto",
    body: `${customer}, seu pedido ${orderCode} já está pronto.`,
    url: `/pedido/${orderCode}`,
    tag: `churraspao-${orderCode}`,
  });

  const results = await Promise.allSettled(
    rows.map((row) =>
      webpush.sendNotification(row.subscription_json, payload).catch(async (pushError: any) => {
        const statusCode = Number(pushError?.statusCode ?? 0);
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        }
        throw pushError;
      }),
    ),
  );

  res.status(200).json({
    ok: true,
    orderCode,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  });
}
