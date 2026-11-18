"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Segmented } from "@/components/ui/segmented";

const montado = () => () => {};

export function EscolherTema() {
  const { theme, setTheme } = useTheme();
  // O tema só é conhecido no navegador; antes disso mostra "Automático".
  const noCliente = useSyncExternalStore(montado, () => true, () => false);
  return (
    <Segmented
      ariaLabel="Tema"
      value={noCliente ? (theme ?? "system") : "system"}
      onChange={setTheme}
      options={[
        { value: "light", label: <><Sun /> Claro</> },
        { value: "dark", label: <><Moon /> Escuro</> },
        { value: "system", label: <><Monitor /> Automático</> },
      ]}
    />
  );
}
