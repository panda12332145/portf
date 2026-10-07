"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  Gauge,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings2,
  Type,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/cn";
import ThemeToggle from "@/components/site/ThemeToggle";
import { SiteIcon } from "@/components/site/Icon";
import { apiGet } from "./fields";
import Overview from "./sections/Overview";
import SiteTab from "./sections/SiteTab";
import CommissionsTab from "./sections/CommissionsTab";
import FaqTab from "./sections/FaqTab";
import GalleryTab from "./sections/GalleryTab";
import BookTab from "./sections/BookTab";
import InboxTab from "./sections/InboxTab";
import AccountTab from "./sections/AccountTab";

export type TabId =
  | "painel"
  | "textos"
  | "comissoes"
  | "faq"
  | "obras"
  | "livro"
  | "mensagens"
  | "conta";

const TABS: { id: TabId; label: string; Icon: typeof Gauge }[] = [
  { id: "painel", label: "Painel", Icon: LayoutDashboard },
  { id: "textos", label: "Textos e imagens", Icon: Type },
  { id: "comissoes", label: "Comissões", Icon: Settings2 },
  { id: "faq", label: "FAQ", Icon: HelpCircle },
  { id: "obras", label: "Obras do site", Icon: Images },
  { id: "livro", label: "Livro", Icon: BookOpen },
  { id: "mensagens", label: "Mensagens", Icon: Inbox },
  { id: "conta", label: "Conta", Icon: UserCog },
];

export default function AdminPanel({
  admin,
  initialTab = "painel",
}: {
  admin: { email: string; name: string };
  initialTab?: TabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [newRequests, setNewRequests] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    void apiGet<{ settings?: { newRequests?: number } }>("/api/admin/session").then((res) => {
      if (res.ok && res.data?.settings) setNewRequests(res.data.settings.newRequests ?? 0);
    });
  }, [tab]);

  const logout = async () => {
    setLeaving(true);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-soil-900 pb-24">
      <header className="sticky top-0 z-40 border-b border-cream/10 bg-soil-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <SiteIcon name="Flower2" size={17} className="text-sun-400" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sun-300">
                Administração
              </p>
              <p className="text-[11px] text-cream/45">{admin.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle compact />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-cream/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cream/70 transition hover:border-cream/50 hover:text-cream"
            >
              <ExternalLink size={12} /> Ver site
            </Link>
            <button
              onClick={logout}
              disabled={leaving}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cream/70 transition hover:border-red-400/60 hover:text-red-200 disabled:opacity-50"
            >
              <LogOut size={12} /> {leaving ? "Saindo…" : "Sair"}
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-4 pb-2 sm:px-6">
          <ul className="flex flex-wrap gap-1.5">
            {TABS.map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
                    tab === id
                      ? "bg-sun-400 text-ink"
                      : "text-cream/55 hover:bg-cream/10 hover:text-cream",
                  )}
                >
                  <Icon size={13} />
                  {label}
                  {id === "mensagens" && newRequests > 0 ? (
                    <span
                      className={cn(
                        "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        tab === id ? "bg-ink text-sun-300" : "bg-sun-400 text-ink",
                      )}
                    >
                      {newRequests}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {tab === "painel" ? <Overview admin={admin} onGo={setTab} /> : null}
        {tab === "textos" ? <SiteTab /> : null}
        {tab === "comissoes" ? <CommissionsTab /> : null}
        {tab === "faq" ? <FaqTab /> : null}
        {tab === "obras" ? <GalleryTab /> : null}
        {tab === "livro" ? <BookTab /> : null}
        {tab === "mensagens" ? <InboxTab /> : null}
        {tab === "conta" ? <AccountTab /> : null}
      </main>
    </div>
  );
}
