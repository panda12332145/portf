"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import {
  Area,
  Btn,
  Card,
  Check2,
  Field,
  Num,
  Status,
  Text,
  apiGet,
  apiSend,
  useResource,
  useStatus,
  type Row,
} from "../fields";

/* ==================================================================
 *  Comissões: abertas/fechadas, preços, e-mail de destino, Discord
 *  e o catálogo de estilos que aparece no formulário do site.
 * ================================================================== */

interface StyleRow extends Row {
  slug: string;
  name: string;
  price: number;
}

const SETTING_KEYS = [
  "commissions_open",
  "commissions_closed_title",
  "commissions_closed_note",
  "commission_email",
  "discord_enabled",
  "discord_username",
  "smtp_enabled",
  "smtp_host",
  "smtp_port",
  "smtp_secure",
  "smtp_user",
  "smtp_from",
] as const;

export default function CommissionsTab() {
  const status = useStatus();
  const styles = useResource<StyleRow>("styles");

  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [secrets, setSecrets] = useState<{ discord_webhook: boolean; smtp_pass: boolean }>({
    discord_webhook: false,
    smtp_pass: false,
  });
  const [webhook, setWebhook] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"discord" | "email" | null>(null);
  const [newStyle, setNewStyle] = useState({ name: "", price: "" });
  const [secretSource, setSecretSource] = useState("arquivo");

  useEffect(() => {
    void apiGet<{
      settings: Record<string, string>;
      secrets: { discord_webhook: boolean; smtp_pass: boolean };
      secretSource: string;
    }>("/api/admin/settings").then((res) => {
      if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao carregar as configurações.");
      const safe: Record<string, string> = {};
      for (const key of SETTING_KEYS) safe[key] = res.data.settings[key] ?? "";
      setSettings(safe);
      setDraft(safe);
      setSecrets(res.data.secrets);
      setSecretSource(res.data.secretSource);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const saveSettings = async () => {
    setSaving(true);
    const patch: Record<string, string> = {};
    for (const key of SETTING_KEYS) {
      if (draft[key] !== settings?.[key]) patch[key] = draft[key];
    }
    if (webhook) patch.discord_webhook = webhook;
    if (smtpPass) patch.smtp_pass = smtpPass;

    const res = await apiSend<{ settings: Record<string, string>; secrets: typeof secrets }>(
      "/api/admin/settings",
      "PATCH",
      patch,
    );
    setSaving(false);
    if (!res.ok || !res.data) return status.fail(res.error ?? "Falha ao salvar.");
    setSettings(draft);
    setSecrets(res.data.secrets);
    setWebhook("");
    setSmtpPass("");
    status.say("Configurações salvas.");
  };

  const clearSecret = async (key: "discord_webhook" | "smtp_pass") => {
    const res = await apiSend("/api/admin/settings", "PATCH", { [key]: "" });
    if (res.ok) {
      setSecrets((s) => ({ ...s, [key]: false }));
      status.say("Valor removido do banco.");
    } else status.fail(res.error ?? "Falha ao remover.");
  };

  const test = async (kind: "discord" | "email") => {
    setTesting(kind);
    const res = await apiSend<{ detail?: string }>("/api/admin/test", "POST", { kind });
    setTesting(null);
    if (res.ok) status.say(res.data?.detail ?? "Teste enviado.");
    else status.fail(res.error ?? "O teste falhou.");
  };

  const addStyle = async () => {
    const price = Number(newStyle.price.replace(",", "."));
    if (!newStyle.name.trim() || !Number.isFinite(price)) {
      return status.fail("Informe o nome e o preço do novo estilo.");
    }
    const res = await styles.create({ name: newStyle.name.trim(), price });
    if (res.ok) {
      setNewStyle({ name: "", price: "" });
      status.say("Estilo adicionado ao formulário do site.");
    } else status.fail(res.error ?? "Falha ao criar.");
  };

  const open = draft.commissions_open === "1";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream">Comissões</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-cream/55">
          Controle a abertura das comissões, os preços dos estilos, o e-mail que recebe os pedidos e o
          webhook do Discord.
        </p>
      </div>

      <Status error={status.error} ok={status.ok} />

      <Card title="A fila está aberta?" hint="Com as comissões fechadas, o formulário dá lugar à sua mensagem.">
        <div className="grid gap-5 md:grid-cols-2">
          <Check2
            checked={open}
            onChange={(v) => set("commissions_open", v ? "1" : "0")}
            label="Comissões abertas"
            hint="Desligue quando a fila encher."
          />
          <Field label="Título quando fechado">
            <Text
              value={draft.commissions_closed_title ?? ""}
              onChange={(v) => set("commissions_closed_title", v)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Descrição quando fechado" hint="Aparece no lugar do formulário. Use Enter para separar parágrafos.">
              <Area
                value={draft.commissions_closed_note ?? ""}
                onChange={(v) => set("commissions_closed_note", v)}
                rows={4}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Onde os pedidos chegam"
        hint={`Os pedidos ficam SEMPRE na aba Mensagens. O e-mail e o Discord são avisos extras. Segredos são cifrados com AES-256-GCM (chave: ${secretSource}).`}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="E-mail que recebe as comissões">
            <Text
              value={draft.commission_email ?? ""}
              onChange={(v) => set("commission_email", v)}
              placeholder="contato@ateliergirassol.art"
            />
          </Field>

          <div className="space-y-3">
            <Check2
              checked={draft.discord_enabled === "1"}
              onChange={(v) => set("discord_enabled", v ? "1" : "0")}
              label="Avisar no Discord"
              hint="Envia um cartão com nome, e-mail, estilos e estimativa."
            />
            <Field
              label="Webhook do Discord"
              hint={
                secrets.discord_webhook
                  ? "Já existe um webhook salvo (cifrado). Digite outro para substituir."
                  : "Cole a URL do webhook do canal. Ela fica cifrada no banco."
              }
            >
              <Text
                value={webhook}
                onChange={setWebhook}
                placeholder={secrets.discord_webhook ? "••••• (salvo)" : "https://discord.com/api/webhooks/…"}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant="outline" onClick={() => test("discord")} disabled={testing !== null}>
                {testing === "discord" ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Testar webhook
              </Btn>
              {secrets.discord_webhook ? (
                <Btn size="sm" variant="ghost" onClick={() => clearSecret("discord_webhook")}>
                  <Trash2 size={12} /> Remover webhook
                </Btn>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Check2
              checked={draft.smtp_enabled === "1"}
              onChange={(v) => set("smtp_enabled", v ? "1" : "0")}
              label="Enviar também por e-mail (SMTP)"
              hint="Opcional. Precisa de um servidor de e-mail (Gmail, Zoho, Resend…)."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Servidor SMTP">
                <Text value={draft.smtp_host ?? ""} onChange={(v) => set("smtp_host", v)} placeholder="smtp.gmail.com" />
              </Field>
              <Field label="Porta">
                <Text value={draft.smtp_port ?? ""} onChange={(v) => set("smtp_port", v)} placeholder="587" />
              </Field>
              <Field label="Remetente" hint="Costuma ser o mesmo usuário.">
                <Text value={draft.smtp_from ?? ""} onChange={(v) => set("smtp_from", v)} />
              </Field>
              <Field label="Usuário">
                <Text value={draft.smtp_user ?? ""} onChange={(v) => set("smtp_user", v)} />
              </Field>
              <Field
                label="Senha / chave"
                hint={secrets.smtp_pass ? "Já existe uma senha salva (cifrada)." : "Fica cifrada no banco."}
              >
                <Text value={smtpPass} onChange={setSmtpPass} type="password" placeholder={secrets.smtp_pass ? "••••• (salva)" : "senha de app"} />
              </Field>
              <div className="flex items-end">
                <Check2
                  checked={draft.smtp_secure === "1"}
                  onChange={(v) => set("smtp_secure", v ? "1" : "0")}
                  label="TLS direto (465)"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant="outline" onClick={() => test("email")} disabled={testing !== null}>
                {testing === "email" ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Enviar e-mail de teste
              </Btn>
              {secrets.smtp_pass ? (
                <Btn size="sm" variant="ghost" onClick={() => clearSecret("smtp_pass")}>
                  <Trash2 size={12} /> Remover senha
                </Btn>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-cream/10 pt-5">
          <Btn variant="gold" onClick={saveSettings} disabled={saving}>
            <Save size={13} /> {saving ? "Salvando…" : "Salvar configurações"}
          </Btn>
        </div>
      </Card>

      <Card
        title="Estilos de arte e preços"
        hint="É exatamente esta lista que aparece em “Estilos de arte — selecione quantos quiser”, com estes preços."
      >
        <div className="space-y-2">
          {styles.rows.map((row, i) => (
            <StyleRowEditor
              key={row.id}
              row={row}
              first={i === 0}
              last={i === styles.rows.length - 1}
              onMove={(delta) => void styles.move(row.id, delta)}
              onSave={async (patch) => {
                const res = await styles.patch(row.id, patch);
                if (res.ok) status.say("Estilo atualizado.");
                else status.fail(res.error ?? "Falha ao salvar.");
              }}
              onDelete={async () => {
                const res = await styles.remove(row.id);
                if (res.ok) status.say("Estilo removido do formulário.");
                else status.fail(res.error ?? "Falha ao remover.");
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-cream/10 pt-5">
          <Field label="Novo estilo" className="min-w-[220px] flex-1">
            <Text
              value={newStyle.name}
              onChange={(v) => setNewStyle((s) => ({ ...s, name: v }))}
              placeholder="ex.: Ilustração de capa"
            />
          </Field>
          <Field label="Preço (R$)" className="w-32">
            <Text
              value={newStyle.price}
              onChange={(v) => setNewStyle((s) => ({ ...s, price: v }))}
              placeholder="180"
            />
          </Field>
          <Btn variant="gold" onClick={addStyle}>
            <Plus size={13} /> Adicionar
          </Btn>
        </div>
      </Card>
    </div>
  );
}

function StyleRowEditor({
  row,
  first,
  last,
  onSave,
  onDelete,
  onMove,
}: {
  row: StyleRow;
  first: boolean;
  last: boolean;
  onSave: (patch: Record<string, unknown>) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onMove: (delta: number) => void;
}) {
  const [name, setName] = useState(row.name);
  const [price, setPrice] = useState(String(row.price));
  const dirty = name !== row.name || price !== String(row.price);

  useEffect(() => {
    setName(row.name);
    setPrice(String(row.price));
  }, [row.name, row.price]);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-cream/10 bg-soil-900/40 p-2.5">
      <div className="flex flex-col gap-1">
        <Btn size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={first} title="Subir">
          <ArrowUp size={12} />
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onMove(1)} disabled={last} title="Descer">
          <ArrowDown size={12} />
        </Btn>
      </div>
      <span className="w-7 text-center text-[11px] tabular-nums text-cream/35">{row.ord}</span>
      <Text value={name} onChange={setName} className="min-w-[180px] flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-cream/45">R$</span>
        <Text value={price} onChange={setPrice} className="w-24" />
      </div>
      <Btn size="sm" variant={dirty ? "gold" : "outline"} disabled={!dirty} onClick={() => onSave({ name, price: Number(price.replace(",", ".")) })}>
        <Save size={12} /> Salvar
      </Btn>
      <Btn size="sm" variant="ghost" onClick={onDelete} title="Remover estilo">
        <Trash2 size={13} />
      </Btn>
      <span className="w-full text-[10px] uppercase tracking-[0.18em] text-cream/30 sm:w-auto">
        {row.slug}
      </span>
    </div>
  );
}
