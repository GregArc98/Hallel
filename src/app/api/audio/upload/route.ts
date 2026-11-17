import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { obterContexto } from "@/lib/auth";
import {
  AUDIO_TAMANHO_MAXIMO,
  AUDIO_TIPOS_PERMITIDOS,
  pastaDeAudios,
  uploadDeAudioHabilitado,
} from "@/lib/storage/audio";

/**
 * Autoriza o envio de um áudio direto do navegador para o Vercel Blob
 * (o arquivo não passa pelo nosso servidor). Só admins, só na pasta da própria igreja.
 */
export async function POST(request: Request) {
  if (!uploadDeAudioHabilitado()) {
    return NextResponse.json({ error: "Upload de áudio não configurado" }, { status: 503 });
  }
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resultado = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const ctx = await obterContexto();
        if (!ctx?.admin) throw new Error("Apenas líderes podem enviar áudios");
        if (!pathname.startsWith(pastaDeAudios(ctx.igreja.id)) || pathname.includes("..")) {
          throw new Error("Destino inválido");
        }
        return {
          allowedContentTypes: AUDIO_TIPOS_PERMITIDOS,
          maximumSizeInBytes: AUDIO_TAMANHO_MAXIMO,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(resultado);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Falha no envio";
    return NextResponse.json({ error: mensagem }, { status: 400 });
  }
}
