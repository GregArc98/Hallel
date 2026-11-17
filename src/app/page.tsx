import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Hallel</h1>
      <p className="text-muted-foreground">
        Escalas, repertório e cifras do ministério de louvor — em construção.
      </p>
      <Button asChild size="lg">
        <Link href="/demo">Ver demonstração da cifra</Link>
      </Button>
    </main>
  );
}
