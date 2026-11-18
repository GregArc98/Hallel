"use client";

/** Conversa com o service worker (sw.js). Retorna null se não houver SW (dev, navegador antigo). */
export async function pedirAoSW<T = unknown>(tipo: string, urls: string[] = [], tempoMs = 120_000): Promise<T | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const pronto = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 5_000)),
  ]);
  const sw = pronto?.active;
  if (!sw) return null;
  return new Promise<T | null>((resolve) => {
    const canal = new MessageChannel();
    const limite = setTimeout(() => resolve(null), tempoMs);
    canal.port1.onmessage = (e) => {
      clearTimeout(limite);
      resolve(e.data as T);
    };
    sw.postMessage({ tipo, urls }, [canal.port2]);
  });
}
