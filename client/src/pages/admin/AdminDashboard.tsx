import { Banknote, PackagePlus, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { formatBRL } from "@/lib/brand";
import { getAllCategories, getAllProducts, getLocalProducts } from "@/lib/localCatalog";

function KpiCard({ icon: Icon, label, value, accent }: { icon: typeof Banknote; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-gradient-to-br from-[#2a1200] to-[#141414] border-brand/50 ember-glow" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-brand-bright" : "text-muted-foreground"}`} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${accent ? "text-brand-bright" : ""}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const products = getAllProducts();
  const editedProducts = getLocalProducts();
  const categories = getAllCategories();

  return (
    <AdminLayout title="Dashboard" subtitle="Visão geral do sistema local">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard icon={Banknote} label="Faturamento" value={formatBRL(0)} accent />
          <KpiCard icon={ShoppingCart} label="Pedidos" value="0" />
          <KpiCard icon={PackagePlus} label="Produtos" value={String(products.length)} />
          <KpiCard icon={Users} label="Clientes" value="0" />
          <button onClick={() => navigate("/admin/produtos")} className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-brand/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-bright" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alterados no admin</p>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{editedProducts.length}</p>
            <p className="text-[11px] font-semibold text-brand-bright">Gerenciar produtos</p>
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Status do sistema</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Categorias</p>
              <p className="mt-1 font-display text-2xl font-bold">{categories.length}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Cardápio base</p>
              <p className="mt-1 font-display text-2xl font-bold">Ativo</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Banco online</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-bright">Modo local</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
