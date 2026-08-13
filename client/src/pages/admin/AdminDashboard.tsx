import { useEffect, useMemo, useState } from "react";
import { Banknote, PackagePlus, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { formatBRL } from "@/lib/brand";
import { getAllCategories, getAllProducts, getLocalProducts, registerProductSalesFromOrders } from "@/lib/localCatalog";
import { getOrders, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";
import { hasSupabaseConfig } from "@/lib/supabaseClient";

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

function isToday(date: string) {
  const value = new Date(date);
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const products = getAllProducts();
  const editedProducts = getLocalProducts();
  const categories = getAllCategories();

  useEffect(() => {
    const refresh = () => {
      void getOrders().then((nextOrders) => {
        setOrders(nextOrders);
        registerProductSalesFromOrders(nextOrders);
      });
    };

    refresh();
    return subscribeToOrders(refresh);
  }, []);

  const stats = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(order.createdAt));
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const customers = new Set(orders.map((order) => `${order.customerName}|${order.customerPhone}`.toLowerCase()));
    const inProgress = orders.filter((order) => ["new", "accepted", "preparing", "ready", "delivering"].includes(order.status)).length;
    const delivered = orders.filter((order) => order.status === "finished").length;

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      customers: customers.size,
      inProgress,
      delivered,
    };
  }, [orders]);

  return (
    <AdminLayout title="Dashboard" subtitle="Visao geral do sistema online">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard icon={Banknote} label="Faturamento hoje" value={formatBRL(stats.todayRevenue)} accent />
          <KpiCard icon={ShoppingCart} label="Pedidos hoje" value={String(stats.todayOrders)} />
          <KpiCard icon={PackagePlus} label="Produtos" value={String(products.length)} />
          <KpiCard icon={Users} label="Clientes" value={String(stats.customers)} />
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
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Categorias</p>
              <p className="mt-1 font-display text-2xl font-bold">{categories.length}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Em andamento</p>
              <p className="mt-1 font-display text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Entregues</p>
              <p className="mt-1 font-display text-2xl font-bold">{stats.delivered}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Banco online</p>
              <p className={`mt-1 font-display text-2xl font-bold ${hasSupabaseConfig ? "text-brand-bright" : "text-destructive"}`}>
                {hasSupabaseConfig ? "Ativo" : "Local"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
