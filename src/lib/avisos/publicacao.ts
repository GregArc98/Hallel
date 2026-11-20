import "server-only";

import { headers } from "next/headers";
import { after } from "next/server";

import type { Contexto } from "@/lib/auth";
import { carregarRepertorio } from "@/lib/escala/dados";
import { createClient } from "@/lib/supabase/server";
import { enviarAvisos } from "./enviar";
import { type CultoDoAviso, type Escalacao, avisosDeEscala, avisosDeRepertorio } from "./mensagens";

/** Endereço do app nesta requisição (produção ou pré-visualização). */
export async function enderecoDoApp(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

type Cliente = Awaited<ReturnType<typeof createClient>>;

async function carregarCultos(supabase: Cliente, igrejaId: string, ids: string[]): Promise<CultoDoAviso[]> {
  const { data, error } = await supabase
    .from("culto")
    .select("id, data, periodo, titulo, horario")
    .eq("igreja_id", igrejaId)
    .in("id", ids);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function carregarEscalados(supabase: Cliente, igrejaId: string, ids: string[]): Promise<Escalacao[]> {
  const { data, error } = await supabase.rpc("avisos_destinatarios", { p_igreja: igrejaId, p_cultos: ids });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    integranteId: d.integrante_id,
    nome: d.nome,
    email: d.email ?? null,
    cultoId: d.culto_id,
    funcao: d.funcao,
    ordem: d.ordem,
  }));
}

function emSegundoPlano(tarefa: () => Promise<unknown>) {
  after(async () => {
    try {
      await tarefa();
    } catch (e) {
      console.error("Hallel: não foi possível enviar os avisos", e);
    }
  });
}

/** Depois de publicar a escala: avisa cada escalado (um aviso com todos os cultos dele). */
export async function avisarEscalaPublicada(ctx: Contexto, cultoIds: string[]) {
  if (cultoIds.length === 0) return;
  const supabase = await createClient();
  const base = await enderecoDoApp();
  emSegundoPlano(async () => {
    const [cultos, escalados] = await Promise.all([
      carregarCultos(supabase, ctx.igreja.id, cultoIds),
      carregarEscalados(supabase, ctx.igreja.id, cultoIds),
    ]);
    await enviarAvisos(supabase, ctx.igreja, avisosDeEscala(cultos, escalados, base), base);
  });
}

/** Depois de publicar o repertório: avisa quem está escalado no culto (se a escala já saiu). */
export async function avisarRepertorioPublicado(ctx: Contexto, cultoId: string) {
  const supabase = await createClient();
  const base = await enderecoDoApp();
  emSegundoPlano(async () => {
    const { data: culto } = await supabase
      .from("culto")
      .select("id, data, periodo, titulo, horario, escala_publicada")
      .eq("igreja_id", ctx.igreja.id)
      .eq("id", cultoId)
      .maybeSingle();
    if (!culto?.escala_publicada) return;
    const [itens, escalados] = await Promise.all([
      carregarRepertorio(cultoId),
      carregarEscalados(supabase, ctx.igreja.id, [cultoId]),
    ]);
    const musicas = itens.map((i) => ({ titulo: i.titulo, tom: i.tom ?? i.tomOriginal }));
    await enviarAvisos(supabase, ctx.igreja, avisosDeRepertorio(culto, musicas, escalados, base), base);
  });
}
