"use client";

import { useEffect, useState } from "react";
import { KeyRound, Mail, Save, ShieldCheck } from "lucide-react";
import { Btn, Card, Field, Status, Text, apiGet, apiSend, useStatus } from "../fields";

/* ==================================================================
 *  Conta da administradora — nome, e-mail e troca de senha
 * ================================================================== */

interface AccountInfo {
  id: number;
  email: string;
  name: string;
  createdAt: number;
  lastLoginAt: number | null;
  sessions: number;
}

export default function AccountTab() {
  const status = useStatus();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [form, setForm] = useState({ name: "", email: "", current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiGet<{ account: AccountInfo }>("/api/admin/account").then((res) => {
      if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao carregar a conta.");
      setAccount(res.data.account);
      setForm((f) => ({ ...f, name: res.data!.account.name, email: res.data!.account.email }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!form.current) return status.fail("Confirme com a sua senha atual.");
    setBusy(true);
    const res = await apiSend<{ changed: { profile: boolean; password: boolean } }>(
      "/api/admin/account",
      "PATCH",
      {
        currentPassword: form.current,
        name: form.name,
        email: form.email,
        newPassword: form.next || undefined,
        confirmPassword: form.next ? form.confirm : undefined,
      },
    );
    setBusy(false);
    if (!res.ok) return status.fail(res.error ?? "Falha ao salvar.");
    setForm((f) => ({ ...f, current: "", next: "", confirm: "" }));
    status.say(
      res.data?.changed.password
        ? "Conta atualizada e senha trocada (as outras sessões foram encerradas)."
        : "Conta atualizada.",
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream">Conta</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
          Atualize o seu nome, o e-mail de entrada e a senha. Recomenda-se trocar a senha de vez em
          quando — ao trocar, as outras sessões abertas são encerradas.
        </p>
      </div>

      <Status error={status.error} ok={status.ok} />

      <Card title="Dados de acesso">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nome">
            <Text value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          </Field>
          <Field label="E-mail de entrada">
            <Text value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          </Field>
          <Field label="Senha atual" hint="Obrigatória para qualquer alteração.">
            <Text
              value={form.current}
              onChange={(v) => setForm((f) => ({ ...f, current: v }))}
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <div />
          <Field label="Nova senha" hint="Mínimo de 8 caracteres, com letras e números. Deixe em branco para manter.">
            <Text
              value={form.next}
              onChange={(v) => setForm((f) => ({ ...f, next: v }))}
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirmar nova senha">
            <Text
              value={form.confirm}
              onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
              type="password"
              placeholder="••••••••"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end border-t border-cream/10 pt-5">
          <Btn variant="gold" onClick={save} disabled={busy}>
            <Save size={13} /> {busy ? "Salvando…" : "Salvar conta"}
          </Btn>
        </div>
      </Card>

      <Card title="Acesso e sessões">
        <div className="grid gap-4 text-[12px] leading-relaxed text-cream/60 md:grid-cols-2">
          <p className="flex items-start gap-2">
            <ShieldCheck size={15} className="mt-px shrink-0 text-sun-300/80" />
            <span>
              <strong className="font-semibold text-cream/85">Senha protegida:</strong> nunca fica
              salva em texto legível — quem acessar os arquivos do site não consegue lê-la.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <KeyRound size={15} className="mt-px shrink-0 text-sun-300/80" />
            <span>
              <strong className="font-semibold text-cream/85">Sessões ativas:</strong>{" "}
              {account ? account.sessions : "…"}
              <br />
              <span className="text-cream/40">
                cada entrada cria uma sessão, que encerra ao clicar em “Sair” ou depois de 7 dias.
              </span>
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Mail size={15} className="mt-px shrink-0 text-sun-300/80" />
            <span>
              <strong className="font-semibold text-cream/85">Último acesso:</strong>{" "}
              {account?.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString("pt-BR") : "—"}
              <br />
              <span className="text-cream/40">
                conta criada em {account ? new Date(account.createdAt).toLocaleDateString("pt-BR") : "—"}
              </span>
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
}
