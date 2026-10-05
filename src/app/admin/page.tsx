import type { Metadata } from "next";
import { currentUser } from "@/lib/admin/guard";
import { countAdmins } from "@/db/admin";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminPanel from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administração — Atelier Girassol",
  robots: { index: false, follow: false },
};

/**
 * Área administrativa.
 * Sem sessão válida a página é SÓ a tela de login — nada de conteúdo
 * do painel é renderizado antes da autenticação.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await currentUser();

  if (!user) {
    const target = next && /^\/[^\s]*$/.test(next) ? next : "/admin";
    return <AdminLogin next={target} hasAccount={countAdmins() > 0} />;
  }

  return <AdminPanel admin={{ email: user.email, name: user.name }} />;
}
