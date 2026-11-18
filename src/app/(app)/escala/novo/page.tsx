import type { Metadata } from "next";

import { exigirAdmin } from "@/lib/auth";
import { chaveMes, hoje, lerMes, primeiroEUltimoDia } from "@/lib/escala/datas";
import { FormularioCulto } from "./formulario-culto";

export const metadata: Metadata = { title: "Novo culto" };

export default async function NovoCultoPage({ searchParams }: PageProps<"/escala/novo">) {
  await exigirAdmin();
  const { mes: param } = await searchParams;
  const hojeStr = hoje();
  const mes = lerMes(typeof param === "string" ? param : null, hojeStr);
  const [primeiro] = primeiroEUltimoDia(mes);
  const dataInicial = hojeStr.startsWith(chaveMes(mes)) ? hojeStr : primeiro;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Culto avulso</h1>
      <p className="text-sm text-muted-foreground">
        Para eventos fora dos domingos (vigília, conferência, culto especial).
      </p>
      <FormularioCulto dataInicial={dataInicial} voltar={`/escala?mes=${chaveMes(mes)}`} />
    </div>
  );
}
