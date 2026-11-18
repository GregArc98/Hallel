import { describe, expect, it } from "vitest";

import { formatarTempo, nomeDoArquivo, pular, rotuloSemitons, semitonsDoAudio } from "../ensaio";

describe("player de ensaio", () => {
  it("segue a cifra ou o ajuste manual, com limite de ±6", () => {
    expect(semitonsDoAudio(true, 3, 0)).toBe(3); // E → G
    expect(semitonsDoAudio(true, 10, 0)).toBe(-2); // caminho mais curto
    expect(semitonsDoAudio(true, null, -2)).toBe(-2); // fora do visualizador: manual
    expect(semitonsDoAudio(false, 3, 1)).toBe(1);
    expect(semitonsDoAudio(false, 0, 9)).toBe(6);
  });

  it("formata tempo e semitons", () => {
    expect(formatarTempo(65)).toBe("1:05");
    expect(formatarTempo(3725)).toBe("1:02:05");
    expect(formatarTempo(Number.NaN)).toBe("0:00");
    expect(rotuloSemitons(0)).toBe("original");
    expect(rotuloSemitons(2)).toBe("+2");
    expect(rotuloSemitons(-3)).toBe("−3");
  });

  it("nome do arquivo para baixar/compartilhar", () => {
    expect(nomeDoArquivo("Felicidade no Serviço", "E", "https://x.public.blob.vercel-storage.com/audios/a/felicidade-AbC123.mp3")).toBe(
      "Felicidade no Serviço - E.mp3",
    );
    expect(nomeDoArquivo('Ao/Que "É" Digno', null, "https://x.blob.vercel-storage.com/a.m4a")).toBe("Ao Que É Digno.m4a");
  });

  it("voltar/avançar 10s sem sair da música", () => {
    expect(pular(5, -10, 200)).toBe(0);
    expect(pular(100, 10, 200)).toBe(110);
    expect(pular(195, 10, 200)).toBe(199.75);
  });
});
