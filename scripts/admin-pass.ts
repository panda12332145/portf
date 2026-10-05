/**
 * ------------------------------------------------------------------
 *  npm run admin:pass — conta administrativa (e-mail e senha)
 * ------------------------------------------------------------------
 *  Uso:
 *    npm run admin:pass                      → nova senha para a 1ª conta
 *    npm run admin:pass -- --list            → mostra as contas
 *    npm run admin:pass -- email@x.com senha → cria/atualiza essa conta
 *
 *  A senha nunca é gravada em claro: o banco guarda
 *  Argon2id(senha, salt de 16 bytes) com hash de 64 bytes.
 * ------------------------------------------------------------------
 */
import { buildDatabase, dbPath } from "../src/db/build";
import { findAdminByEmail } from "../src/db/admin";
import { createAdminAccount, changePassword, updateProfile } from "../src/lib/auth";
import { generatePassword, passwordProblem } from "../src/lib/password";
import { openDatabase } from "../src/db/sqlite";

const args = process.argv.slice(2).filter((a) => a !== "--");

async function main() {
  buildDatabase({ quiet: true });

  const db = openDatabase(dbPath(), { readOnly: true });
  const admins = db.all<{ id: number; email: string; name: string; created_at: number }>(
    `SELECT id, email, name, created_at FROM admins ORDER BY id`,
  );
  db.close();

  if (args.includes("--list")) {
    if (!admins.length) console.log("[admin] nenhuma conta cadastrada");
    for (const a of admins) {
      console.log(`[admin] #${a.id} ${a.email}${a.name ? ` (${a.name})` : ""}`);
    }
    return;
  }

  const [email, password] = args;
  const finalPassword = password && !passwordProblem(password) ? password : generatePassword();
  if (!password) {
    // sem senha informada, geramos uma
  } else if (passwordProblem(password)) {
    console.log(`[admin] senha informada é fraca (${passwordProblem(password)}) — geramos uma forte`);
  }

  if (email) {
    const existing = findAdminByEmail(email);
    if (existing) {
      changePassword(existing.id, finalPassword);
      console.log(`[admin] senha atualizada para ${existing.email}`);
    } else {
      const created = createAdminAccount({ email, password: finalPassword });
      console.log(`[admin] conta criada: ${created.email}`);
    }
  } else {
    const first = admins[0];
    if (!first) {
      const created = createAdminAccount({ email: "admin@ateliergirassol.art", password: finalPassword });
      console.log(`[admin] conta criada: ${created.email}`);
    } else {
      changePassword(first.id, finalPassword);
      console.log(`[admin] senha atualizada para ${first.email}`);
    }
  }

  console.log(`[admin] senha: ${finalPassword}`);
  console.log("[admin] guarde agora — ela não fica salva em lugar nenhum em texto puro");
}

void updateProfile;
main().catch((err) => {
  console.error("[admin] falhou:", err);
  process.exit(1);
});
