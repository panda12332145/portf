import fs from "node:fs/promises";
import path from "node:path";
import { imageSize } from "./image-size";
import { slugify } from "./admin/spec";

/* ==================================================================
 *  Upload de imagens do painel
 *  • "site" → public/images/   (obras e imagens do site)
 *  • "book" → public/book/     (pasta exclusiva do livro)
 *  O nome do arquivo é sempre reescrito: sem acento, sem espaço e
 *  sem extensão executável.
 * ================================================================== */

export const UPLOAD_FOLDERS = { site: "images", book: "book" } as const;
export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export interface UploadedImage {
  path: string;
  name: string;
  folder: UploadFolder;
  width: number | null;
  height: number | null;
  bytes: number;
}

export async function saveUpload(
  file: File,
  folder: UploadFolder,
  hint?: string,
): Promise<UploadedImage> {
  if (!(folder in UPLOAD_FOLDERS)) throw new Error("Pasta de destino inválida.");

  const ext =
    MIME_EXT[file.type] ??
    (file.name.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1] ?? "").toLowerCase().replace("jpeg", "jpg");
  if (!ext || !["jpg", "png", "webp", "gif", "avif"].includes(ext)) {
    throw new Error("Formato não aceito. Use JPG, PNG, WebP, GIF ou AVIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Imagem muito grande (máximo ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`);
  }

  const base = slugify(hint || file.name.replace(/\.[^.]+$/, "")) || "imagem";
  const stamp = Date.now().toString(36);
  const filename = `${base}-${stamp}.${ext}`;

  const relative = path.join(UPLOAD_FOLDERS[folder], filename);
  const absolute = path.join(process.cwd(), "public", relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, Buffer.from(await file.arrayBuffer()));

  const size = imageSize(absolute);
  return {
    path: `/${relative.split(path.sep).join("/")}`,
    name: filename,
    folder,
    width: size?.width ?? null,
    height: size?.height ?? null,
    bytes: file.size,
  };
}

export interface LibraryItem {
  path: string;
  name: string;
  folder: UploadFolder;
  width: number | null;
  height: number | null;
}

/** Tudo que já existe em public/images e public/book (para o seletor). */
export async function listLibrary(): Promise<LibraryItem[]> {
  const out: LibraryItem[] = [];
  for (const [folder, dir] of Object.entries(UPLOAD_FOLDERS) as [UploadFolder, string][]) {
    const absolute = path.join(process.cwd(), "public", dir);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(absolute);
    } catch {
      continue;
    }
    for (const name of entries.filter((n) => /\.(jpe?g|png|webp|gif|avif)$/i.test(n)).sort()) {
      const size = imageSize(path.join(absolute, name));
      out.push({
        path: `/${dir}/${name}`,
        name,
        folder,
        width: size?.width ?? null,
        height: size?.height ?? null,
      });
    }
  }
  return out;
}

/** Dimensões de um arquivo já publicado (usado ao trocar a imagem por caminho). */
export function dimensionsOf(publicPath: string | null | undefined) {
  if (!publicPath) return null;
  if (!publicPath.startsWith("/")) return null;
  return imageSize(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}
