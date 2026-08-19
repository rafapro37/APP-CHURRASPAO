import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Calculator, Megaphone, Target, TrendingUp } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { formatBRL } from "@/lib/brand";
import { getAllProducts } from "@/lib/localCatalog";
import { getOrders, groupOrderItems, subscribeToOrders, type LocalOrder } from "@/lib/localOrders";

function isToday(date: string) {
  const value = new Date(date);
  const now = new Date();
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth() && value.getDate() === now.getDate();
}

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-brand/50 bg-gradient-to-br from-[#2a1200] to-card" : "border-border bg-card"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${highlight ? "text-brand-bright" : ""}`}>{value}</p>
    </div>
  );
}

function buildAdvice(question: string, metrics: { revenue: number; orders: number; ticket: number; topProduct: string }, discount: number, goal: number) {
  const normalized = question.toLowerCase();
  const hasOrders = metrics.orders > 0;
  const gap = Math.max(0, goal - metrics.revenue);
  const ordersNeeded = metrics.ticket > 0 ? Math.ceil(gap / metrics.ticket) : 0;
  const discountText = discount > 0 ? `Com ${discount}% de desconto, use pedido minimo para proteger o lucro.` : "Comece com uma oferta simples, sem desconto agressivo.";

  if (!hasOrders) {
    return [
      "Ainda nao ha pedidos suficientes para uma analise precisa.",
      "Primeiro objetivo: gerar movimento com uma promocao clara de abertura, por exemplo combo com bebida ou entrega facilitada.",
      "Depois de alguns pedidos, o painel vai indicar ticket medio, produto mais vendido e oportunidades melhores.",
    ];
  }

  if (normalized.includes("cupom") || normalized.includes("desconto") || normalized.includes("promoc")) {
    return [
      `Produto com mais forca no momento: ${metrics.topProduct}. Use ele como chamada principal da campanha.`,
      discountText,
      ordersNeeded > 0 ? `Para bater a meta informada faltam cerca de ${ordersNeeded} pedidos no ticket medio atual.` : "A meta informada ja foi batida pelo faturamento atual.",
    ];
  }

  if (normalized.includes("cliente") || normalized.includes("frequ")) {
    return [
      "Clientes que compram mais de uma vez devem receber cupom com validade curta, de 3 a 7 dias.",
      "Evite desconto para todo mundo o tempo inteiro. Melhor usar recompensa para recompra.",
      `Ticket medio atual: ${formatBRL(metrics.ticket)}. O cupom deve incentivar o cliente a passar desse valor.`,
    ];
  }

  if (normalized.includes("lucro") || normalized.includes("margem") || normalized.includes("preco")) {
    return [
      "Para proteger margem, prefira combos com bebida ou porcao em vez de baixar muito o preco do lanche principal.",
      `Com ticket medio de ${formatBRL(metrics.ticket)}, uma promocao boa deve aumentar itens no carrinho, nao apenas reduzir preco.`,
      "Se o desconto passar da margem do produto, use pedido minimo ou limite por cliente.",
    ];
  }

  return [
    `Hoje o sistema registrou ${metrics.orders} pedido(s) e ${formatBRL(metrics.revenue)} em faturamento.`,
    metrics.topProduct ? `Destaque a campanha em cima de ${metrics.topProduct}, que ja tem venda registrada.` : "Ainda nao existe produto campeao definido.",
    ordersNeeded > 0 ? `Para chegar na meta, busque mais ${ordersNeeded} pedido(s) no ticket medio atual.` : "A meta informada esta dentro do ritmo atual.",
  ];
}

export default function AdminGestao() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [foodCost, setFoodCost] = useState("35");
  const [goal, setGoal] = useState("500");
  const [campaignBudget, setCampaignBudget] = useState("50");
  const [discount, setDiscount] = useState("10");
  const [question, setQuestion] = useState("Qual a melhor promocao para vender mais hoje?");
  const [answer, setAnswer] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => void getOrders().then(setOrders);
    refresh();
    return subscribeToOrders(refresh);
  }, []);

  const products = getAllProducts();

  const metrics = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== "cancelled");
    const finishedOrders = validOrders.filter((order) => order.status === "finished");
    const todayOrders = validOrders.filter((order) => isToday(order.createdAt));
    const revenue = todayOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const ticket = todayOrders.length > 0 ? revenue / todayOrders.length : 0;
    const productSales = new Map<string, number>();

    for (const order of validOrders) {
      for (const item of groupOrderItems(order.itemsJson)) {
        productSales.set(item.productName, (productSales.get(item.productName) ?? 0) + item.quantity);
      }
    }

    const topProduct = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    return {
      revenue,
      todayOrders: todayOrders.length,
      ticket,
      finished: finishedOrders.length,
      active: validOrders.filter((order) => ["new", "accepted", "preparing", "ready", "delivering"].includes(order.status)).length,
      topProduct,
    };
  }, [orders]);

  const calc = useMemo(() => {
    const costPercent = Math.min(95, Math.max(0, toNumber(foodCost)));
    const goalValue = Math.max(0, toNumber(goal));
    const budgetValue = Math.max(0, toNumber(campaignBudget));
    const discountPercent = Math.min(90, Math.max(0, toNumber(discount)));
    const estimatedMargin = Math.max(0, 100 - costPercent - discountPercent);
    const missingRevenue = Math.max(0, goalValue - metrics.revenue);
    const ordersNeeded = metrics.ticket > 0 ? Math.ceil(missingRevenue / metrics.ticket) : 0;
    const maxCoupon = Math.max(0, metrics.ticket * (discountPercent / 100));

    return {
      estimatedMargin,
      missingRevenue,
      ordersNeeded,
      maxCoupon,
      budgetValue,
    };
  }, [campaignBudget, discount, foodCost, goal, metrics.revenue, metrics.ticket]);

  const analyze = () => {
    setAnswer(buildAdvice(question, { revenue: metrics.revenue, orders: metrics.todayOrders, ticket: metrics.ticket, topProduct: metrics.topProduct }, toNumber(discount), toNumber(goal)));
  };

  return (
    <AdminLayout title="Gestao" subtitle="Calculadora inteligente para decisoes do negocio">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Faturamento hoje" value={formatBRL(metrics.revenue)} highlight />
        <MetricCard label="Pedidos hoje" value={String(metrics.todayOrders)} />
        <MetricCard label="Ticket medio" value={formatBRL(metrics.ticket)} />
        <MetricCard label="Em andamento" value={String(metrics.active)} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand-bright" />
            <h2 className="font-display text-xl font-bold">Calculadora de campanha</h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              Custo medio do produto (%)
              <input value={foodCost} onChange={(event) => setFoodCost(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              Meta de faturamento hoje (R$)
              <input value={goal} onChange={(event) => setGoal(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              Verba para campanha (R$)
              <input value={campaignBudget} onChange={(event) => setCampaignBudget(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-muted-foreground">
              Desconto pensado (%)
              <input value={discount} onChange={(event) => setDiscount(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand" />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Margem estimada apos desconto</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-bright">{calc.estimatedMargin.toFixed(0)}%</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Falta para a meta</p>
              <p className="mt-1 font-display text-2xl font-bold">{formatBRL(calc.missingRevenue)}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Pedidos necessarios</p>
              <p className="mt-1 font-display text-2xl font-bold">{calc.ordersNeeded}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Cupom medio sugerido</p>
              <p className="mt-1 font-display text-2xl font-bold">{formatBRL(calc.maxCoupon)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand-bright" />
            <h2 className="font-display text-xl font-bold">IA calculadora inteligente</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pergunte sobre estrategia, campanha, cupom, preco ou meta. A analise usa somente os dados reais do sistema.
          </p>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-4 min-h-28 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-brand"
          />
          <button type="button" onClick={analyze} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-bright">
            <Megaphone className="h-4 w-4" />
            Analisar estrategia
          </button>

          <div className="mt-4 rounded-2xl bg-background p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-bright" />
              <p className="font-display text-lg font-bold">Resposta da gestao</p>
            </div>
            {answer.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Clique em analisar para receber uma sugestao.</p>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {answer.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-bright" />
          <h2 className="font-display text-xl font-bold">Resumo para decisao</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-background p-4">
            <p className="text-xs uppercase text-muted-foreground">Produto com venda registrada</p>
            <p className="mt-1 font-display text-xl font-bold">{metrics.topProduct || "Sem pedidos ainda"}</p>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="text-xs uppercase text-muted-foreground">Produtos ativos</p>
            <p className="mt-1 font-display text-xl font-bold">{products.length}</p>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="text-xs uppercase text-muted-foreground">Pedidos entregues</p>
            <p className="mt-1 font-display text-xl font-bold">{metrics.finished}</p>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
