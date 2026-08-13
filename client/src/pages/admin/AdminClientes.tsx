import AdminLayout from "./AdminLayout";
import { trpc } from "@/lib/trpc";

export default function AdminClientes() {
  const { data, isLoading } = trpc.admin.customers.list.useQuery();
  const customers = (data ?? []) as any[];

  return (
    <AdminLayout title="Clientes" subtitle="Clientes cadastrados">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando clientes...</p>}
        {!isLoading && customers.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        )}
        {customers.map((customer) => (
          <article key={customer.id} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">{customer.name ?? "Cliente"}</h2>
            <p className="text-sm text-muted-foreground">{customer.email ?? "Sem e-mail"}</p>
            <p className="mt-2 text-xs text-brand-bright">ID #{customer.id}</p>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
