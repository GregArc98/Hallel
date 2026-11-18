import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem internet" };

/** Mostrada pelo service worker quando a página pedida não está salva no aparelho. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <WifiOff className="size-12 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold">Sem internet</h1>
      <p className="text-muted-foreground">
        Esta página ainda não está salva no aparelho. O repertório dos seus próximos cultos fica
        disponível sem internet depois que você abre o Hallel conectado.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> de propósito: recarrega a página inteira, que o aparelho tem salva */}
      <a href="/" className="font-medium text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </a>
    </main>
  );
}
