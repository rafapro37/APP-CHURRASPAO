import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { formatBRL } from "@/lib/brand";

export default function AdminPromocoes() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.promotions.list.useQuery();
  const create = trpc.admin.promotions.create.useMutation({ onSuccess: () => utils.admin.promotions.list.invalidate() });
  const remove = trpc.admin.promotions.remove.useMutation({ onSuccess: () => utils.admin.promotions.list.invalidate() });
  const [form, setForm] = useState({ title: "", subtitle: "", promoPrice: "" });
  const promotions = (data ?? []) as any[];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    create.mutate({ title: form.title, subtitle: form.subtitle, promoPrice: form.promoPrice ? Number(form.promoPrice.replace(",", ".")) : null, isAvailable: true });
    setForm({ title: "", subtitle: "", promoPrice: "" });
  };

  return (
    <AdminLayout title="Promocoes" subtitle="Ofertas e banners">
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none md:col-span-2" placeholder="Subtitulo" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" placeholder="Preco promo" value={form.promoPrice} onChange={(e) => setForm({ ...form, promoPrice: e.target.value })} />
        <button className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white md:col-span-4">Adicionar promocao</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promotion) => (
          <article key={promotion.id} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">{promotion.title}</h2>
            <p className="text-sm text-muted-foreground">{promotion.subtitle}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-brand-bright">{promotion.promoPrice ? formatBRL(Number(promotion.promoPrice)) : "Sem preco"}</span>
              <button onClick={() => remove.mutate({ id: Number(promotion.id) })} className="text-xs text-destructive">Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
