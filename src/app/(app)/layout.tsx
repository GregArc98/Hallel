import Link from "next/link";

import { NavInferior, NavTopo } from "@/components/app-nav";
import { AvisoOffline } from "@/components/pwa/aviso-offline";
import { SairButton } from "@/components/sair-button";
import { exigirIntegrante } from "@/lib/auth";

/** Área logada: exige integrante cadastrado. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const ctx = await exigirIntegrante();

  return (
    // --nav-h: altura da barra inferior no celular (elementos flutuantes ficam acima dela).
    <div className="flex flex-1 flex-col [--nav-h:4rem] md:[--nav-h:0px]">
      <AvisoOffline />
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2">
          <Link href="/" className="font-semibold tracking-tight">
            Hallel
          </Link>
          <span className="truncate text-sm text-muted-foreground">{ctx.igreja.nome}</span>
          <NavTopo />
          <div className="ml-auto">
            <SairButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(1.5rem+var(--nav-h))]">
        {children}
      </div>
      <NavInferior />
    </div>
  );
}
