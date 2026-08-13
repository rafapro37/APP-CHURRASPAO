import { supabase } from "@/lib/supabaseClient";

const PUSH_SUPPORTED =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const env = import.meta.env as Record<string, string | undefined>;
const VAPID_PUBLIC_KEY = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function canUsePushNotifications() {
  return Boolean(PUSH_SUPPORTED && VAPID_PUBLIC_KEY);
}

export async function registerServiceWorker() {
  if (!PUSH_SUPPORTED) return null;

  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.warn("[Churraspao] Nao foi possivel registrar o app no celular:", error);
    return null;
  }
}

export async function askPushPermission() {
  if (!canUsePushNotifications()) return false;

  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    return permission === "granted";
  } catch {
    return false;
  }
}

export async function subscribeCurrentDevice(orderCode: string) {
  if (!orderCode || !canUsePushNotifications() || !supabase) return false;

  const allowed = await askPushPermission();
  if (!allowed) return false;

  const registration = await registerServiceWorker();
  if (!registration) return false;

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const payload = {
      order_code: orderCode,
      endpoint: subscription.endpoint,
      subscription_json: subscription.toJSON(),
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("push_subscriptions").upsert(payload, { onConflict: "order_code,endpoint" });
    if (error) {
      console.error("[Churraspao] Nao foi possivel salvar a notificacao do celular:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Churraspao] Nao foi possivel ativar notificacao push:", error);
    return false;
  }
}

export async function showReadyNotification(title: string, body: string, url: string) {
  const registration = await registerServiceWorker();
  if (!registration || !("Notification" in window) || Notification.permission !== "granted") return false;

  try {
    await registration.showNotification(title, {
      body,
      icon: "/brand/logo.png",
      badge: "/brand/logo.png",
      tag: "churraspao-pedido-pronto",
      data: { url },
      vibrate: [700, 220, 700, 220, 900],
      requireInteraction: true,
    });
    return true;
  } catch (error) {
    console.warn("[Churraspao] Notificacao do sistema indisponivel:", error);
    return false;
  }
}
