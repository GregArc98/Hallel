"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { SENHA_MAXIMA } from "@/lib/acesso/senha";

const campo =
  "h-12 w-full rounded-lg border bg-background pr-12 pl-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Campo de senha com botão de mostrar/esconder (ajuda quem digita no celular). */
export function CampoSenha({
  rotulo,
  name,
  value,
  onChange,
  nova = false,
}: {
  rotulo: string;
  name?: string;
  value: string;
  onChange: (valor: string) => void;
  /** true para criar/trocar senha (o gerenciador de senhas sugere uma nova). */
  nova?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{rotulo}</span>
      <span className="relative block">
        <input
          type={visivel ? "text" : "password"}
          name={name}
          required
          maxLength={SENHA_MAXIMA}
          autoComplete={nova ? "new-password" : "current-password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={campo}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visivel ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
    </label>
  );
}
