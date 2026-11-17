import Link from "next/link";

import { SairButton } from "@/components/sair-button";
import { exigirIntegrante } from "@/lib/auth";

/** Área logada: exige integrante cadastrado. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const ctx = await exigirIntegrante();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2">
          <Link href="/" className="font-semibold tracking-tight">
            Hallel
          </Link>
          <span className="truncate text-sm text-muted-foreground">{ctx.igreja.nome}</span>
          <div className="ml-auto">
            <SairButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
