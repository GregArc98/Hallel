"use client";

import { BellOff, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { removerInscricaoPush, salvarInscricaoPush } from "@/app/(app)/perfil/acoes";
import { Button } from "@/components/ui/button";
import { type SituacaoAvisos, chaveParaBytes, inscricaoAtual, lerSituacao } from "@/lib/avisos/cliente";

async function inscrever(chave: string): Promise<boolean> {
  const reg = await navigator.serviceWorker.ready;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const inscricao =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave) }));
    const r = await salvarInscricaoPush(inscricao.toJSON());
    if (r === "ok") return true;
    // Aparelho já ligado a outra conta: gera uma inscrição nova e tenta de novo.
    await inscricao.unsubscribe();
    if (r === "erro") return false;
  }
  return false;
}

const TEXTOS: Record<Exclude<SituacaoAvisos, "carregando" | "ligado" | "desligado">, string> = {
  "sem-suporte": "Este navegador não recebe avisos. No celular, use o Chrome (Android) ou o Safari (iPhone).",
  "instalar-iphone":
    "No iPhone, primeiro adicione o Hallel à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá. Depois volte aqui para ativar.",
  bloqueado:
    "Os avisos estão bloqueados neste aparelho. Libere nas configurações do navegador (Notificações → Hallel) e volte aqui.",
};

/** Liga/desliga os avisos no celular, neste aparelho. */
export function AtivarAvisos({ chave, aoMudar }: { chave: string; aoMudar?: (ligado: boolean) => void }) {
  const [situacao, setSituacao] = useState<SituacaoAvisos>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    void lerSituacao().then(setSituacao);
  }, []);

  async function ligar() {
    setOcupado(true);
    setErro(false);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setSituacao(permissao === "denied" ? "bloqueado" : "desligado");
        return;
      }
      const ok = await inscrever(chave);
      setErro(!ok);
      setSituacao(ok ? "ligado" : "desligado");
      if (ok) aoMudar?.(true);
    } catch {
      setErro(true);
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setOcupado(true);
    try {
      const inscricao = await inscricaoAtual();
      if (inscricao) {
        await removerInscricaoPush(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setSituacao("desligado");
      aoMudar?.(false);
    } finally {
      setOcupado(false);
    }
  }

  if (situacao === "carregando") return <p className="text-sm text-muted-foreground">Verificando…</p>;
  if (!chave) return <p className="text-sm text-muted-foreground">Os avisos no celular ainda não foram configurados.</p>;
  if (situacao !== "ligado" && situacao !== "desligado") {
    return <p className="text-sm text-muted-foreground">{TEXTOS[situacao]}</p>;
  }

  return (
    <div className="space-y-2">
      {situacao === "ligado" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <BellRing className="size-4" /> Avisos ligados neste aparelho
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={desligar} disabled={ocupado}>
            <BellOff /> Desligar
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={ligar} disabled={ocupado}>
          {ocupado ? <Loader2 className="animate-spin" /> : <BellRing />} Ativar avisos no celular
        </Button>
      )}
      {erro && <p className="text-sm text-destructive">Não foi possível ativar agora. Tente de novo.</p>}
    </div>
  );
}
