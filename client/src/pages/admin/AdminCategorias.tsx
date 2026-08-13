import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAllCategories, removeLocalCategory, saveLocalCategory } from "@/lib/localCatalog";

export default function AdminCategorias() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState(getAllCategories);

  const refresh = () => setCategories(getAllCategories());

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    saveLocalCategory(name);
    setName("");
    refresh();
  };

  return (
    <AdminLayout title="Categorias" subtitle="Organize o cardápio sem emojis">
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto]">
        <input className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" placeholder="Nome da categoria" value={name} onChange={(event) => setName(event.target.value)} />
        <button className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">Adicionar</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const canRemove = category.id > 100000;
          return (
            <div key={category.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <span className="font-semibold">{category.name}</span>
              {canRemove ? (
                <button
                  onClick={() => {
                    removeLocalCategory(category.id);
                    refresh();
                  }}
                  className="text-xs text-destructive"
                >
                  Excluir
                </button>
              ) : (
                <span className="text-[11px] text-muted-foreground">Padrão</span>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
