import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Formulário simples (funciona sem JavaScript). */
export function SairButton({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  return (
    <form action="/auth/sair" method="post">
      <Button type="submit" variant={variant}>
        <LogOut /> Sair
      </Button>
    </form>
  );
}
