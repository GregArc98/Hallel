import { z } from "zod";

import { parseKey } from "@/lib/music";

/** Move um item da posição `de` para `para` (cópia nova). */
export function moverItem<T>(lista: T[], de: number, para: number): T[] {
  if (de === para || de < 0 || para < 0 || de >= lista.length || para >= lista.length) return lista;
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
}

export const LIMITE_MUSICAS = 40;

export const esquemaRepertorio = z.object({
  itens: z
    .array(
      z.object({
        musica_id: z.uuid(),
        tom: z
          .string()
          .trim()
          .refine((t) => t === "" || parseKey(t) !== null, "Tom inválido"),
        observacao: z.string().trim().max(300, "Observação muito longa (máx. 300)"),
      }),
    )
    .max(LIMITE_MUSICAS, `No máximo ${LIMITE_MUSICAS} músicas`),
  observacoes: z.string().max(2000, "Observações muito longas"),
});

export type RepertorioEntrada = z.input<typeof esquemaRepertorio>;

/** Tom em que a música será tocada no culto (o do culto, ou o original). */
export function tomDoCulto(tom: string | null, tomOriginal: string | null): string | null {
  return tom || tomOriginal;
}
