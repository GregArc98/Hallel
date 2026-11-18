import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço pode estar errado, ou o item foi excluído.</p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}
