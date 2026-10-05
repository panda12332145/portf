import { NextResponse } from "next/server";
import { guard } from "@/lib/admin/guard";
import { listLibrary, saveUpload, type UploadFolder } from "@/lib/upload";

export const dynamic = "force-dynamic";

/** GET  → tudo o que já existe em public/images e public/book. */
export async function GET() {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ library: await listLibrary() });
}

/**
 * POST (multipart: file, folder="site"|"book", name?)
 * "site" → public/images/  ·  "book" → public/book/
 */
export async function POST(req: Request) {
  const auth = await guard();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const folder = (String(form.get("folder") ?? "site") as UploadFolder) ?? "site";
  const name = form.get("name") ? String(form.get("name")) : undefined;

  try {
    const image = await saveUpload(file, folder, name);
    return NextResponse.json({ ok: true, image });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao salvar a imagem." },
      { status: 400 },
    );
  }
}
