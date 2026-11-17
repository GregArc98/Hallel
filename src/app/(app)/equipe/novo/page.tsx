import type { Metadata } from "next";

import { exigirAdmin } from "@/lib/auth";
import { carregarFuncoes } from "@/lib/equipe/dados";
import { IntegranteForm } from "../integrante-form";

export const metadata: Metadata = { title: "Novo integrante" };

export default async function NovoIntegrantePage() {
  const ctx = await exigirAdmin();
  const funcoes = await carregarFuncoes(ctx.igreja.id);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Novo integrante</h1>
      <IntegranteForm
        funcoes={funcoes}
        euMesmo={false}
        valores={{ nome: "", email: "", telefone: "", papel: "membro", ativo: true, marcadas: [] }}
      />
    </div>
  );
}
