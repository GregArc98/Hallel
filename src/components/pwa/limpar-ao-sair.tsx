"use client";

import { useEffect } from "react";

import { pedirAoSW } from "@/lib/pwa/sw-cliente";

/** Ao sair da conta, apaga páginas e áudios salvos no aparelho (podem ser de outra pessoa). */
export function LimparAoSair() {
  useEffect(() => {
    void pedirAoSW("limpar");
  }, []);
  return null;
}
