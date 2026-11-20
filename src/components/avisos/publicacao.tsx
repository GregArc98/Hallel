import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { linkWhatsapp } from "@/lib/avisos/mensagens";

/** Caixinha "Avisar os escalados" nos formulários de publicar (marcada por padrão). */
export function OpcaoAvisar({ rotulo = "Avisar os escalados (celular e e-mail)" }: { rotulo?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="avisar" value="1" defaultChecked className="size-4 accent-primary" />
      {rotulo}
    </label>
  );
}

/** Abre o WhatsApp com o texto pronto (a pessoa escolhe o grupo). */
export function BotaoWhatsapp({ texto, rotulo = "Mandar no grupo do WhatsApp" }: { texto: string; rotulo?: string }) {
  return (
    <Button asChild variant="outline">
      <a href={linkWhatsapp(texto)} target="_blank" rel="noopener noreferrer">
        <MessageCircle /> {rotulo}
      </a>
    </Button>
  );
}
