"use client";

import { CalendarDays, Home, Library, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/escala", rotulo: "Escala", icone: CalendarDays },
  { href: "/musicas", rotulo: "Músicas", icone: Library },
  { href: "/equipe", rotulo: "Equipe", icone: Users },
] as const;

function ativo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/escala" && pathname.startsWith("/disponibilidade")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Links no cabeçalho (computador). */
export function NavTopo() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
      {ITENS.map(({ href, rotulo }) => (
        <Link
          key={href}
          href={href}
          aria-current={ativo(pathname, href) ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
            ativo(pathname, href) && "bg-accent text-foreground",
          )}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior (celular). A altura fica em --nav-h para elementos flutuantes não ficarem por baixo. */
export function NavInferior() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md">
        {ITENS.map(({ href, rotulo, icone: Icone }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={ativo(pathname, href) ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
                ativo(pathname, href) && "text-primary",
              )}
            >
              <Icone className="size-6" aria-hidden />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
