import { Link } from "wouter";
import { ArrowRight, MapPin } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { useState } from "react";

export default function Entrada() {
  const [logo] = useState(getBrandLogo);

  return (
    <main className="charcoal-texture flex min-h-screen flex-col bg-[#0B0B0B] text-white">
      <section className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center px-5 py-8">
        <div className="text-center">
          <img src={logo} alt="CHURRASPÃO E CIA" className="mx-auto h-32 w-32 rounded-full object-cover ring-2 ring-brand-bright shadow-[0_0_42px_rgba(244,122,11,0.35)]" />
          <h1 className="mt-5 font-display text-4xl font-bold leading-none">{BRAND.name}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Churraspão, cuscuz, tapioca, porções e bebidas preparados para matar sua fome.
          </p>
        </div>

        <Link href="/cardapio" className="mt-7 block overflow-hidden rounded-3xl border border-brand/45 bg-black shadow-[0_18px_55px_rgba(217,101,8,0.14)]">
          <img src={BRAND.heroBanner} alt="CHURRASPÃO E CIA" className="w-full object-contain" />
        </Link>

        <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-brand-bright" />
            Entrega em toda a cidade
          </p>
        </div>

        <Link href="/cardapio" className="btn-press mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display text-base font-bold uppercase tracking-wide text-white shadow-2xl shadow-brand/30">
          Fazer pedido <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </main>
  );
}
