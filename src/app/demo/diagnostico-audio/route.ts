// TEMPORÁRIO: verifica se o Vercel Blob libera leitura entre sites (CORS) para o player de ensaio.
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? "";
  let alvo: URL;
  try {
    alvo = new URL(u);
  } catch {
    return NextResponse.json({ erro: "url inválida" }, { status: 400 });
  }
  if (!alvo.hostname.endsWith(".public.blob.vercel-storage.com")) {
    return NextResponse.json({ erro: "só Vercel Blob" }, { status: 400 });
  }
  const origem = request.nextUrl.origin;
  const get = await fetch(alvo, { headers: { Origin: origem, Range: "bytes=0-1023" } });
  const preflight = await fetch(alvo, {
    method: "OPTIONS",
    headers: { Origin: origem, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "range" },
  });
  const pegar = (r: Response) => Object.fromEntries([...r.headers].filter(([k]) => /access-control|content-type|content-range|accept-ranges/i.test(k)));
  return NextResponse.json({ origem, get: { status: get.status, headers: pegar(get) }, preflight: { status: preflight.status, headers: pegar(preflight) } });
}
