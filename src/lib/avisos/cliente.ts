"use client";

/** Chave pública VAPID (base64url) no formato que o navegador pede. */
export function chaveParaBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const preenchido = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const bruto = atob(preenchido.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

export type SituacaoAvisos =
  | "carregando"
  | "sem-suporte"
  | "instalar-iphone" // iPhone/iPad: só funciona com o Hallel adicionado à Tela de Início
  | "bloqueado" // a pessoa negou a permissão (só dá para mudar nos ajustes do navegador)
  | "desligado"
  | "ligado";

export function ehIphone(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function abertoComoApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function inscricaoAtual(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function lerSituacao(): Promise<SituacaoAvisos> {
  const suporta = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!suporta) return ehIphone() && !abertoComoApp() ? "instalar-iphone" : "sem-suporte";
  if (Notification.permission === "denied") return "bloqueado";
  return (await inscricaoAtual()) && Notification.permission === "granted" ? "ligado" : "desligado";
}
