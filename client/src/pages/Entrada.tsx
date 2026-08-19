import { Link } from "wouter";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "lucide-react";
import ContactButtons from "@/components/ContactButtons";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { useState } from "react";

export default function Entrada() {
  const [logo] = useState(getBrandLogo);

  return (
    <main className="charcoal-texture flex min-h-screen flex-col bg-[#0B0B0B] text-white">
      <section className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center px-5 py-7">
        <div className="rounded-[28px] border border-brand/35 bg-card/70 p-5 shadow-[0_26px_70px_rgba(217,101,8,0.16)] backdrop-blur">
          <div className="text-center">
            <img src={logo} alt="CHURRASPAO E CIA" className="mx-auto h-36 w-36 rounded-full object-cover ring-2 ring-white shadow-[0_0_46px_rgba(244,122,11,0.42)]" />
            <p className="mt-4 font-semibold text-brand-bright">Sabor que conquista</p>
            <h1 className="mt-1 font-display text-4xl font-bold leading-none">{BRAND.name}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Churraspao, cuscuz, tapioca, porcoes e bebidas preparados para o seu pedido.
            </p>
          </div>

          <Link href="/cardapio" className="mt-6 block overflow-hidden rounded-3xl border border-brand/45 bg-black">
            <img src={BRAND.heroBanner} alt="CHURRASPAO E CIA" className="w-full object-contain" />
          </Link>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-border bg-background px-3 py-3 text-center">
              <Clock className="mx-auto h-4 w-4 text-brand-bright" />
              <p className="mt-1 font-display text-sm font-bold">30-50</p>
              <p className="text-[10px] text-muted-foreground">min</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-3 py-3 text-center">
              <ShieldCheck className="mx-auto h-4 w-4 text-brand-bright" />
              <p className="mt-1 font-display text-sm font-bold">130g</p>
              <p className="text-[10px] text-muted-foreground">carne</p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-3 py-3 text-center">
              <MapPin className="mx-auto h-4 w-4 text-brand-bright" />
              <p className="mt-1 font-display text-sm font-bold">Local</p>
              <p className="text-[10px] text-muted-foreground">entrega</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3">
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-brand-bright" />
              Entrega em toda a cidade
            </p>
          </div>

          <Link href="/cardapio" className="btn-press mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display text-base font-bold uppercase tracking-wide text-white shadow-2xl shadow-brand/30">
            Fazer pedido <ArrowRight className="h-5 w-5" />
          </Link>

          <div className="mt-3">
            <ContactButtons compact />
          </div>
        </div>
      </section>
    </main>
  );
}
