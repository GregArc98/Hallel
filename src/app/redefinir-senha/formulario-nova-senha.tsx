"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CampoSenha } from "@/components/campo-senha";
import { Button } from "@/components/ui/button";
import { mensagemDoErro, problemaNaSenha } from "@/lib/acesso/senha";
import { createClient } from "@/lib/supabase/client";

export function FormularioNovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = problemaNaSenha(senha, repetida);
    if (problema) return setErro(problema);
    setErro(null);
    setSalvando(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    if (error) {
      setSalvando(false);
      setErro(mensagemDoErro(error, "nova-senha"));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <CampoSenha rotulo="Nova senha (mínimo 8 caracteres)" value={senha} onChange={setSenha} nova />
      <CampoSenha rotulo="Repita a nova senha" value={repetida} onChange={setRepetida} nova />
      {erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={salvando}>
        <KeyRound /> {salvando ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
