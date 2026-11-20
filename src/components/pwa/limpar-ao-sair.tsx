"use client";

import { useEffect } from "react";

import { pedirAoSW } from "@/lib/pwa/sw-cliente";

/**
 * Ao sair da conta, apaga páginas e áudios salvos no aparelho (podem ser de outra pessoa) e
 * cancela os avisos deste aparelho (o servidor apaga a inscrição no próximo envio).
 */
export function LimparAoSair() {
  useEffect(() => {
    void pedirAoSW("limpar");
    void navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((s) => s?.unsubscribe())
      .catch(() => {});
  }, []);
  return null;
}
