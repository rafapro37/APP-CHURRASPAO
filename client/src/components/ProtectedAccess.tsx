import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { getBrandLogo } from "@/lib/localCatalog";
import { grantAccess, isAccessGranted, type StaffRole } from "@/lib/accessControl";

const ROLE_TITLE: Record<StaffRole, string> = {
  admin: "Painel Administrativo",
  garcom: "Acesso Garcom",
  cozinha: "Painel da Cozinha",
};

export default function ProtectedAccess({ role, children }: { role: StaffRole; children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(() => isAccessGranted(role));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [logo] = useState(getBrandLogo);

  if (allowed) return <>{children}</>;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (grantAccess(role, password)) {
      setAllowed(true);
      setError("");
      return;
    }
    setError("Senha incorreta");
  };

  return (
    <main className="charcoal-texture flex min-h-screen items-center justify-center bg-[#0B0B0B] px-5 py-8 text-white">
      <form onSubmit={submit} className="w-full max-w-[390px] rounded-3xl border border-border bg-card p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/85 bg-black p-2 shadow-[0_0_34px_rgba(244,122,11,0.28)]">
          <img src={logo} alt={BRAND.name} className="h-full w-full rounded-full object-contain" />
        </div>
        <div className="mt-5 text-center">
          <p className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand/15 text-brand-bright">
            <LockKeyhole className="h-5 w-5" />
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold">{ROLE_TITLE[role]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Area restrita do {BRAND.name}</p>
        </div>

        <label className="mt-6 block text-xs font-semibold text-muted-foreground">Senha de acesso</label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoFocus
          placeholder="Digite a senha"
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
        {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}

        <button className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-display text-sm font-bold uppercase text-white">
          Entrar <ArrowRight className="h-4 w-4" />
        </button>

        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-brand-bright">
          Voltar ao app do cliente
        </Link>
      </form>
    </main>
  );
}
