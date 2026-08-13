import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { formatBRL } from "@/lib/brand";

export default function AdminCupons() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.coupons.list.useQuery();
  const create = trpc.admin.coupons.create.useMutation({ onSuccess: () => utils.admin.coupons.list.invalidate() });
  const remove = trpc.admin.coupons.remove.useMutation({ onSuccess: () => utils.admin.coupons.list.invalidate() });
  const [form, setForm] = useState({ code: "", type: "percent", value: "" });
  const coupons = (data ?? []) as any[];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(form.value.replace(",", "."));
    if (!form.code.trim() || Number.isNaN(value)) return;
    create.mutate({ code: form.code, type: form.type as "percent" | "fixed", value, minOrderValue: 0, onePerCustomer: true, isAvailable: true });
    setForm({ code: "", type: "percent", value: "" });
  };

  return (
    <AdminLayout title="Cupons" subtitle="Descontos do app">
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm uppercase outline-none" placeholder="Codigo" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percent">Percentual</option>
          <option value="fixed">Valor fixo</option>
        </select>
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none" placeholder="Valor" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <button className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">Adicionar</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <strong className="text-brand-bright">{coupon.code}</strong>
              <button onClick={() => remove.mutate({ id: Number(coupon.id) })} className="text-xs text-destructive">Excluir</button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {coupon.type === "percent" ? `${coupon.value}%` : formatBRL(Number(coupon.value))}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
