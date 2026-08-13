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

function formatDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "em breve";
  return date.toLocaleDateString("pt-BR");
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo nao permitido" });
    return;
  }

  if (!supabase || !vapidPublicKey || !vapidPrivateKey) {
    res.status(200).json({ ok: false, message: "Push ainda nao configurado na Vercel" });
    return;
  }

  const body = getBody(req);
  const orderCodes = Array.isArray(body.orderCodes) ? body.orderCodes.map(String).filter(Boolean) : [];
  const customerName = typeof body.customerName === "string" ? body.customerName : "Cliente";
  const couponCode = typeof body.couponCode === "string" ? body.couponCode : "VOLTE10";
  const expiresAt = formatDate(body.expiresAt);

  if (orderCodes.length === 0) {
    res.status(400).json({ error: "Cliente sem pedidos para localizar o celular" });
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("order_code, endpoint, subscription_json")
    .in("order_code", orderCodes);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const rowsByEndpoint = new Map<string, PushSubscriptionRow>();
  for (const row of (subscriptions ?? []) as PushSubscriptionRow[]) {
    rowsByEndpoint.set(row.endpoint, row);
  }

  if (rowsByEndpoint.size === 0) {
    res.status(200).json({ ok: false, sent: 0, failed: 0, message: "Cliente ainda nao permitiu notificacoes neste celular" });
    return;
  }

  const payload = JSON.stringify({
    title: "Cupom especial para voce",
    body: `${customerName}, use ${couponCode}. Valido ate ${expiresAt}.`,
    url: "/ofertas",
    tag: `churraspao-cupom-${couponCode}`,
  });

  const results = await Promise.allSettled(
    Array.from(rowsByEndpoint.values()).map((row) =>
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
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  });
}
