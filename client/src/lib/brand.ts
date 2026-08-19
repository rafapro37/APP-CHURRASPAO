export const BRAND = {
  name: "CHURRASPÃO E CIA",
  slogan: "Churrasco de verdade, do nosso jeito.",
  logo: "/brand/logo.png",
  heroBanner: "/brand/hero-banner.png",
  whatsapp: "5511988375507",
  whatsappLabel: "(11) 98837-5507",
  instagram: "https://www.instagram.com/churraspaoecia/?__pwa=1#",
  instagramLabel: "@churraspaoecia",
};

export const PRODUCT_IMAGES = {
  hero: "/brand/hero-banner.png",
  picanha: "/manus-storage/produto-picanha_94aa8da1.png",
  burger: "/manus-storage/produto-burger_eabdc5c6.png",
  burger2: "/manus-storage/produto-burger2_a3349d66.png",
  porcao: "/manus-storage/produto-porcao_5a3a6045.png",
  combo: "/manus-storage/produto-combo_849b8543.png",
  bebida: "/manus-storage/produto-bebida_a56d5803.png",
  suco: "/manus-storage/produto-suco_70d76203.png",
  sobremesa: "/manus-storage/produto-sobremesa_2cecff48.png",
  costela: "/manus-storage/produto-costela_fb1b5613.png",
  linguica: "/manus-storage/produto-linguica_a6a23774.png",
  hotdog: "/manus-storage/produto-hotdog_2834e84e.png",
  frango: "/manus-storage/produto-frango_953b9e3c.png",
} as const;

export const DELIVERY_FEE = 5.0;
export const FREE_DELIVERY_THRESHOLD = 100;

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const STATUS_LABELS: Record<string, string> = {
  new: "Novo pedido",
  accepted: "Aceito",
  preparing: "Em preparo",
  ready: "Pronto",
  delivering: "Saiu para entrega",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const STATUS_EMOJI: Record<string, string> = {
  new: "Novo",
  accepted: "Aceito",
  preparing: "Preparo",
  ready: "Pronto",
  delivering: "Entrega",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const TRACKING_STEPS = ["new", "accepted", "preparing", "ready", "delivering", "finished"] as const;
