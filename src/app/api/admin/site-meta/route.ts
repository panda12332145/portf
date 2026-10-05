import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { sqlite } from "@/db/queries";
import type { SiteMetaRow } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Textos do site (site_meta): lista, grava e apaga qualquer chave. */

export async function GET() {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const rows = sqlite.all<SiteMetaRow>(`SELECT key, value, updated_at FROM site_meta ORDER BY key`);
  return NextResponse.json({ meta: rows });
}

export async function PATCH(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { patch?: Record<string, unknown> };
  const patch = body.patch ?? {};
  const now = Date.now();
  let changed = 0;

  sqlite.tx(() => {
    for (const [key, raw] of Object.entries(patch)) {
      const cleanKey = String(key).trim();
      if (!cleanKey) continue;
      const value =
        raw === null || raw === undefined
          ? ""
          : Array.isArray(raw)
            ? JSON.stringify(raw.map((v) => String(v)))
            : typeof raw === "boolean"
              ? raw
                ? "1"
                : "0"
              : String(raw);

      const before = sqlite.get<{ value: string }>(`SELECT value FROM site_meta WHERE key = ?`, [
        cleanKey,
      ])?.value;
      if (before === value) continue;

      sqlite.run(
        `INSERT INTO site_meta (key, value, updated_at) VALUES (@key, @value, @now)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        { key: cleanKey, value, now },
      );
      changed += 1;
    }
  });

  return NextResponse.json({ ok: true, changed });
}

export async function DELETE(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Informe ?key=" }, { status: 400 });

  const { changes } = sqlite.run(`DELETE FROM site_meta WHERE key = @key`, { key });
  return NextResponse.json({ ok: true, removed: changes });
}
