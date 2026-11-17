import { describe, expect, it } from "vitest";

import { FELICIDADE_NO_SERVICO } from "@/data/exemplos/felicidade-no-servico";
import { parseChordPro } from "@/lib/music";
import { ehBlobDoVercel, idDoYoutube, tipoDeAudio } from "../audio";
import { normalizarBusca, padraoContem } from "../busca";
import { cifraParaEdicao, prepararMusica } from "../formulario";

const vazio = {
  titulo: "",
  artista: "",
  hinario_numero: "",
  hinario_sigla: "",
  tom_original: "",
  bpm: "",
  tags: "",
  cifra_texto: "",
  letra_texto: "",
  audio_url: "",
  audio_url_externo: "",
  youtube_url: "",
  observacoes: "",
};

describe("busca", () => {
  it("normaliza como o banco", () => {
    expect(normalizarBusca("  Felicidade no   SERVIÇO ")).toBe("felicidade no servico");
    expect(normalizarBusca("Ao Que É Digno")).toBe("ao que e digno");
  });
  it("escapa curingas do ILIKE", () => {
    expect(padraoContem("100%_x")).toBe("%100\\%\\_x%");
  });
});

describe("áudio e YouTube", () => {
  it("classifica links de áudio", () => {
    expect(tipoDeAudio("https://abc.public.blob.vercel-storage.com/audios/x-123.mp3")).toBe("arquivo");
    expect(tipoDeAudio("https://site.com/musica.M4A")).toBe("arquivo");
    expect(tipoDeAudio("https://drive.google.com/file/d/123/view")).toBe("drive");
    expect(tipoDeAudio("https://open.spotify.com/track/1")).toBe("link");
    expect(tipoDeAudio("não é link")).toBe("link");
    expect(ehBlobDoVercel("https://abc.public.blob.vercel-storage.com/a.mp3")).toBe(true);
    expect(ehBlobDoVercel("https://evil.com/blob.vercel-storage.com")).toBe(false);
  });
  it("extrai o id do YouTube", () => {
    expect(idDoYoutube("https://www.youtube.com/watch?v=abc123&t=5")).toBe("abc123");
    expect(idDoYoutube("https://youtu.be/abc123")).toBe("abc123");
    expect(idDoYoutube("https://youtube.com/shorts/xyz")).toBe("xyz");
    expect(idDoYoutube("https://vimeo.com/1")).toBeNull();
  });
});

describe("prepararMusica", () => {
  it("exige título", () => {
    const r = prepararMusica(vazio);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.titulo).toBe("Informe o título");
  });

  it("valida tom, BPM, número e links", () => {
    const r = prepararMusica({
      ...vazio,
      titulo: "X",
      tom_original: "H",
      bpm: "500",
      hinario_numero: "abc",
      youtube_url: "https://vimeo.com/1",
      audio_url_externo: "ftp://x",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.erros).sort()).toEqual(
        ["audio_url_externo", "bpm", "hinario_numero", "tom_original", "youtube_url"].sort(),
      );
    }
  });

  it("converte a cifra colada para ChordPro, gera a letra e detecta o tom", () => {
    const r = prepararMusica({
      ...vazio,
      titulo: "Felicidade no Serviço",
      hinario_numero: "410",
      hinario_sigla: "cc",
      tags: "Celebração, hino, celebração",
      cifra_texto: FELICIDADE_NO_SERVICO,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = r.musica;
    expect(m.tom_original).toBe("E");
    expect(m.hinario_sigla).toBe("CC");
    expect(m.hinario_numero).toBe(410);
    expect(m.tags).toEqual(["celebração", "hino"]);
    expect(m.cifra).toContain("{title: Felicidade no Serviço}");
    expect(m.cifra).toContain("{key: E}");
    expect(m.cifra).not.toContain("FELICIDADE NO SERVIÇO");
    expect(m.letra).toContain("Satisfeito, abençoado");
  });

  it("tom informado no formulário vence o da cifra", () => {
    const r = prepararMusica({ ...vazio, titulo: "X", tom_original: "g", cifra_texto: "Tom: E\n\n[Refrão]\nE\nAleluia" });
    expect(r.ok && r.musica.tom_original).toBe("G");
    expect(r.ok && r.musica.cifra).toContain("{key: G}");
  });

  it("sem cifra, usa a letra digitada", () => {
    const r = prepararMusica({ ...vazio, titulo: "X", letra_texto: "  Santo, santo  " });
    expect(r.ok && r.musica.cifra).toBeNull();
    expect(r.ok && r.musica.letra).toBe("Santo, santo");
  });
});

describe("cifraParaEdicao", () => {
  it("volta para o formato do editor sem título/tom, preservando a música", () => {
    const r = prepararMusica({ ...vazio, titulo: "Felicidade no Serviço", cifra_texto: FELICIDADE_NO_SERVICO });
    if (!r.ok) throw new Error("falhou");
    const texto = cifraParaEdicao(r.musica.cifra);
    expect(texto.startsWith("[Intro]")).toBe(true);
    // Editar e salvar de novo não muda nada.
    const r2 = prepararMusica({ ...vazio, titulo: "Felicidade no Serviço", tom_original: "E", cifra_texto: texto });
    if (!r2.ok) throw new Error("falhou");
    expect(parseChordPro(r2.musica.cifra!)).toEqual(parseChordPro(r.musica.cifra!));
  });
});
