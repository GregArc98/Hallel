"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground">
        Não foi possível carregar esta tela. Confira a internet e tente de novo.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw /> Tentar de novo
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Início</Link>
        </Button>
      </div>
      {error.digest && <p className="text-xs text-muted-foreground">Código: {error.digest}</p>}
    </div>
  );
}
