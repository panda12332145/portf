"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/site/ThemeToggle";
import { SiteIcon } from "@/components/site/Icon";
import { Btn, Field, Status, Text } from "./fields";

/* ==================================================================
 *  Entrada da administradora
 *  A área administrativa tem só esta tela até a sessão ser criada.
 * ================================================================== */

export default function AdminLogin({
  next = "/admin",
  hasAccount = true,
}: {
  next?: string;
  /** false quando o banco ainda não tem nenhuma conta criada */
  hasAccount?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Sem conexão com o servidor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="scope-dark relative flex min-h-screen flex-col bg-soil-900 px-5 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(255,203,61,0.16),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cream/55 transition hover:text-cream"
        >
          <ArrowLeft size={13} /> Voltar ao site
        </Link>
        <ThemeToggle compact />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <div className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-7 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-9">
          <div className="flex items-center gap-2.5">
            <SiteIcon name="Flower2" size={17} className="text-sun-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-sun-300">
              Área administrativa
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-cream">
            Entre para editar o site
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-cream/55">
            Use o e-mail e a senha cadastrados no banco (<span className="text-cream/75">data/atelier.sqlite</span>).
          </p>

          {!hasAccount ? (
            <p className="mt-5 rounded-md border border-sun-400/40 bg-sun-400/10 px-3 py-2.5 text-[12px] leading-relaxed text-cream/80">
              O banco ainda não tem conta administrativa. Rode{" "}
              <code className="rounded bg-cream/10 px-1.5 py-0.5">npm run db:build</code> na pasta do
              projeto (o iniciar.bat já faz isso): a senha inicial aparece no terminal.
            </p>
          ) : null}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="E-mail">
              <Text value={email} onChange={setEmail} type="email" placeholder="admin@ateliergirassol.art" />
            </Field>

            <Field label="Senha">
              <span className="relative block">
                <Text
                  value={password}
                  onChange={setPassword}
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-cream/45 transition hover:text-cream"
                  title={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </Field>

            <Status error={error} />

            <Btn type="submit" variant="gold" className="w-full" disabled={busy || !email || !password}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
              {busy ? "Verificando…" : "Entrar"}
            </Btn>
          </form>

          <div className="mt-7 space-y-3 border-t border-cream/10 pt-5 text-[11px] leading-relaxed text-cream/45">
            <p className="flex items-start gap-2">
              <ShieldCheck size={14} className="mt-px shrink-0 text-sun-300/70" />
              A senha é conferida com <strong className="font-semibold text-cream/70">Argon2id</strong> (hash de
              64 bytes + salt de 16 bytes por conta). Nada trafega em texto puro e nada fica salvo em claro no
              banco.
            </p>
            <p className="flex items-start gap-2">
              <KeyRound size={14} className="mt-px shrink-0 text-sun-300/70" />
              Esqueceu a senha? Na pasta do projeto rode{" "}
              <code className="rounded bg-cream/10 px-1.5 py-0.5 text-cream/80">npm run admin:pass</code> para
              definir uma nova.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
