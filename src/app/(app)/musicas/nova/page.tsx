import type { Metadata } from "next";

import { exigirAdmin } from "@/lib/auth";
import { uploadDeAudioHabilitado } from "@/lib/storage/audio";
import { MusicaForm } from "../musica-form";

export const metadata: Metadata = { title: "Nova música" };

export default async function NovaMusicaPage() {
  const ctx = await exigirAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nova música</h1>
      <MusicaForm igrejaId={ctx.igreja.id} uploadHabilitado={uploadDeAudioHabilitado()} />
    </div>
  );
}
