import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { COOKIE_SESSAO } from "@/server/http";
import { validarCredencial } from "@/server/services/auth";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Toda página do painel exige sessão válida no SERVIDOR (não só esconder botões no navegador). */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const admin = await validarCredencial((await cookies()).get(COOKIE_SESSAO)?.value, "web");
  if (!admin) redirect("/admin/login");
  return (
    <>
      <NavAdmin nome={admin.nome} />
      <main id="conteudo" tabIndex={-1} className="admin-main">{children}</main>
    </>
  );
}
