"use client";

import { useEffect } from "react";

/** Mantém a tela ligada enquanto `active` (Screen Wake Lock API). Ignora navegadores sem suporte. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await navigator.wakeLock.request("screen");
        if (cancelled) await s.release();
        else sentinel = s;
      } catch {
        // pode falhar com a aba em segundo plano ou bateria fraca — sem problema
      }
    };
    // O navegador solta o bloqueio quando a aba fica oculta; pede de novo ao voltar.
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
