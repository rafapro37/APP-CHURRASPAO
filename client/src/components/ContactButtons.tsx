import { Instagram, MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function ContactButtons({ compact = false }: { compact?: boolean }) {
  const whatsappUrl = `https://wa.me/${BRAND.whatsapp}`;

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-brand/50 bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-bright"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      <a
        href={BRAND.instagram}
        target="_blank"
        rel="noreferrer"
        className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-brand/60 hover:text-brand-bright"
      >
        <Instagram className="h-4 w-4" />
        {compact ? "Instagram" : BRAND.instagramLabel}
      </a>
    </div>
  );
}
