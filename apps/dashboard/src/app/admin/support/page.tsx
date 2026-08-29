import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";

/**
 * Suporte usa a busca de customers + Customer 360 — tudo que o atendimento
 * precisa (plano, projetos, erros de deploy, billing, uso, eventos) numa tela.
 */
export default async function AdminSupportPage() {
  await requireStaff("support");
  redirect("/admin/customers");
}
