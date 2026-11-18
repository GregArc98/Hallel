"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function inscrever(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Faixa "sem internet" — o conteúdo exibido é a última versão salva no aparelho. */
export function AvisoOffline() {
  const offline = useSyncExternalStore(
    inscrever,
    () => !navigator.onLine,
    () => false,
  );
  if (!offline) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-black">
      <WifiOff className="size-4" /> Sem internet — mostrando o que está salvo no aparelho
    </div>
  );
}
