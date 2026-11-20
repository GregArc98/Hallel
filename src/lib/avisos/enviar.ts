import "server-only";

import nodemailer from "nodemailer";
import webpush from "web-push";

import type { createClient } from "@/lib/supabase/server";
import type { Aviso } from "./mensagens";

type Cliente = Awaited<ReturnType<typeof createClient>>;

/**
 * Envio dos avisos: notificação no celular (Web Push, para cada aparelho inscrito) e e-mail
 * (para quem não desligou). Cada canal só funciona com as variáveis de ambiente dele; sem elas,
 * o canal é pulado sem erro. Roda depois da resposta ao líder (after), então nada aqui trava a tela.
 *
 *  • Push: NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.
 *  • E-mail: SMTP_USUARIO e SMTP_SENHA (Gmail: senha de app). Opcional: SMTP_SERVIDOR, SMTP_PORTA.
 */

const VAPID_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVADA = process.env.VAPID_PRIVATE_KEY;
const SMTP_USUARIO = process.env.SMTP_USUARIO;
const SMTP_SENHA = process.env.SMTP_SENHA;

export interface ResultadoEnvio {
  push: number;
  email: number;
  falhas: number;
}

async function enviarPush(supabase: Cliente, igrejaId: string, avisos: Aviso[], base: string) {
  if (!VAPID_PUBLICA || !VAPID_PRIVADA || avisos.length === 0) return { enviados: 0, falhas: 0 };
  const porPessoa = new Map(avisos.map((a) => [a.integranteId, a]));
  const { data: inscricoes, error } = await supabase.rpc("avisos_inscricoes", {
    p_igreja: igrejaId,
    p_integrantes: [...porPessoa.keys()],
  });
  if (error) throw new Error(`inscrições: ${error.message}`);

  const opcoes = {
    vapidDetails: { subject: base, publicKey: VAPID_PUBLICA, privateKey: VAPID_PRIVADA },
    TTL: 60 * 60 * 24 * 3, // guarda até 3 dias se o celular estiver desligado
    urgency: "normal" as const,
  };
  const vencidas: string[] = [];
  let enviados = 0;
  let falhas = 0;
  await Promise.all(
    (inscricoes ?? []).map(async (s) => {
      const aviso = porPessoa.get(s.integrante_id);
      if (!aviso) return;
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ titulo: aviso.titulo, corpo: aviso.corpo, url: aviso.url }),
          opcoes,
        );
        enviados++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) vencidas.push(s.endpoint);
        else falhas++;
      }
    }),
  );
  if (vencidas.length) await supabase.rpc("avisos_remover_inscricoes", { p_igreja: igrejaId, p_endpoints: vencidas });
  return { enviados, falhas };
}

async function enviarEmails(avisos: Aviso[], igreja: string) {
  const comEmail = avisos.filter((a) => a.email);
  if (!SMTP_USUARIO || !SMTP_SENHA || comEmail.length === 0) return { enviados: 0, falhas: 0 };
  const porta = Number(process.env.SMTP_PORTA ?? 465);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_SERVIDOR ?? "smtp.gmail.com",
    port: porta,
    secure: porta === 465,
    auth: { user: SMTP_USUARIO, pass: SMTP_SENHA },
  });
  let enviados = 0;
  let falhas = 0;
  // Um por vez: o Gmail recusa muitas conexões simultâneas.
  for (const a of comEmail) {
    try {
      await transporte.sendMail({
        from: { name: `Hallel · ${igreja}`, address: SMTP_USUARIO },
        to: { name: a.nome, address: a.email! },
        subject: a.assunto,
        text: a.texto,
      });
      enviados++;
    } catch {
      falhas++;
    }
  }
  transporte.close();
  return { enviados, falhas };
}

export async function enviarAvisos(
  supabase: Cliente,
  igreja: { id: string; nome: string },
  avisos: Aviso[],
  base: string,
): Promise<ResultadoEnvio> {
  const [push, email] = await Promise.allSettled([
    enviarPush(supabase, igreja.id, avisos, base),
    enviarEmails(avisos, igreja.nome),
  ]);
  const r: ResultadoEnvio = { push: 0, email: 0, falhas: 0 };
  for (const [canal, res] of [["push", push], ["email", email]] as const) {
    if (res.status === "fulfilled") {
      r[canal] = res.value.enviados;
      r.falhas += res.value.falhas;
    } else {
      r.falhas++;
      console.error(`Hallel: falha no envio dos avisos (${canal})`, res.reason);
    }
  }
  console.info(`Hallel: avisos enviados — ${r.push} no celular, ${r.email} por e-mail, ${r.falhas} falhas`);
  return r;
}

export const PUSH_CONFIGURADO = Boolean(VAPID_PUBLICA && VAPID_PRIVADA);
