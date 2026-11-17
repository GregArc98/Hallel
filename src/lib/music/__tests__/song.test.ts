import { describe, expect, it } from "vitest";
import {
  isChordLine,
  lineLyrics,
  looksLikeChordPro,
  mergeChordAndLyricLines,
  parseChordPro,
  parseChordsOverLyrics,
  parseFileName,
  parseSongText,
  serializeChordPro,
  serializeChordsOverLyrics,
  songToPlainLyrics,
  transposeSong,
  transposeSongToKey,
  type Line,
  type Song,
} from "..";

import { FELICIDADE_NO_SERVICO as FELICIDADE } from "@/data/exemplos/felicidade-no-servico";

function allChords(song: Song): string[] {
  return song.sections.flatMap((s) =>
    s.lines.flatMap((l: Line) =>
      l.type === "lyrics"
        ? l.segments.flatMap((seg) => (seg.chord ? [seg.chord] : []))
        : l.type === "chords"
          ? l.chords
          : [],
    ),
  );
}

describe("Felicidade no Serviço (cifra real, formato acorde em cima)", () => {
  const song = parseChordsOverLyrics(FELICIDADE);

  it("extrai título e tom do cabeçalho", () => {
    expect(song.meta.title).toBe("FELICIDADE NO SERVIÇO");
    expect(song.meta.key).toBe("E");
  });

  it("identifica as seções e seus tipos", () => {
    expect(song.sections.map((s) => [s.kind, s.label])).toEqual([
      ["intro", "Intro"],
      ["verse", "Estrofe 1"],
      ["chorus", "Refrão"],
      ["verse", "Estrofe 2"],
      ["chorus", "Refrão"],
      ["verse", "Estrofe 3"],
      ["chorus", "Refrão"],
      ["verse", "Estrofe 4"],
      ["chorus", "Refrão"],
    ]);
  });

  it("lê a intro como linhas só de acordes (inclusive na mesma linha do rótulo)", () => {
    expect(song.sections[0].lines).toEqual([
      { type: "chords", chords: ["E", "D/E", "E", "D/E"] },
      { type: "chords", chords: ["E", "D/E", "E", "D/E", "A/E"] },
    ]);
  });

  it("posiciona cada acorde sobre a letra pela coluna", () => {
    const first = song.sections[1].lines[0];
    expect(first).toEqual({
      type: "lyrics",
      segments: [
        { chord: null, lyric: "No serv" },
        { chord: "E", lyric: "iço do meu Rei eu sou feliz" },
      ],
    });
    const lastOfChorus = song.sections[2].lines[3];
    expect(lastOfChorus.type).toBe("lyrics");
    if (lastOfChorus.type === "lyrics") {
      expect(lastOfChorus.segments[0]).toEqual({ chord: "A#°", lyric: "Tem quem ser" });
      expect(lineLyrics(lastOfChorus)).toMatch(/^Tem quem serve a meu bom Rei/);
    }
  });

  it("todas as linhas de letra viram letra (nenhuma é confundida com acorde)", () => {
    const lyrics = songToPlainLyrics(song);
    expect(lyrics).toContain("[Estrofe 1]\nNo serviço do meu Rei eu sou feliz\nSatisfeito, abençoado");
    expect(lyrics).toContain("Tem quem serve a meu bom Rei");
    expect(lyrics).not.toMatch(/F#m|B7|C#m/);
  });

  it("transpõe a música inteira de E para G", () => {
    const g = transposeSongToKey(song, "E", "G");
    expect(g.meta.key).toBe("G");
    expect(new Set(allChords(g))).toEqual(
      new Set(["G", "F/G", "C/G", "Am", "D", "D7", "Em", "C", "D/C", "G/B", "G7/F", "C#°"]),
    );
  });

  it("transpõe para F usando bemóis", () => {
    const f = transposeSongToKey(song, "E", "F");
    expect(f.meta.key).toBe("F");
    expect(allChords(f)).toContain("Eb/F");
    expect(allChords(f)).toContain("C/Bb");
    expect(allChords(f)).toContain("B°");
  });

  it("transpor 0 semitons não altera nada", () => {
    expect(transposeSong(song, 0)).toEqual(song);
  });

  it("ida e volta: ChordPro preserva a estrutura", () => {
    const chordpro = serializeChordPro(song);
    expect(chordpro).toContain("{key: E}");
    expect(chordpro).toContain("{start_of_chorus: Refrão}");
    expect(chordpro).toContain("No serv[E]iço do meu Rei eu sou feliz");
    expect(looksLikeChordPro(chordpro)).toBe(true);
    expect(parseChordPro(chordpro)).toEqual(song);
  });

  it("ida e volta: acorde em cima da letra preserva a estrutura", () => {
    const text = serializeChordsOverLyrics(song);
    expect(parseChordsOverLyrics(text)).toEqual(song);
  });

  it("parseSongText detecta o formato sozinho", () => {
    expect(looksLikeChordPro(FELICIDADE)).toBe(false);
    expect(parseSongText(FELICIDADE)).toEqual(song);
    expect(parseSongText(serializeChordPro(song))).toEqual(song);
  });
});

describe("conversor acorde em cima da letra", () => {
  it("isChordLine", () => {
    expect(isChordLine("       F#m  B       E   B7")).toBe(true);
    expect(isChordLine("E  D/E  |  A/E  (2x)")).toBe(true);
    expect(isChordLine("No serviço do meu Rei")).toBe(false);
    expect(isChordLine("Ao que é digno")).toBe(false);
    expect(isChordLine("Em tudo dai graças")).toBe(false);
    expect(isChordLine("(2x)")).toBe(false);
  });

  it("acorde depois do fim da letra fica no fim", () => {
    expect(mergeChordAndLyricLines("A       E", "Gló")).toEqual([
      { chord: "A", lyric: "Gló     " },
      { chord: "E", lyric: "" },
    ]);
  });

  it("sem rótulos de seção, linhas em branco separam estrofes e não há título", () => {
    const song = parseChordsOverLyrics("C       G\nPrimeira linha\n\nAm\nSegunda");
    expect(song.meta.title).toBeUndefined();
    expect(song.sections).toHaveLength(2);
    expect(song.sections.every((s) => s.label === null)).toBe(true);
  });

  it("linha entre parênteses vira observação", () => {
    const song = parseChordsOverLyrics("[Refrão]\nAleluia\n(repetir 2x)");
    expect(song.sections[0].lines[1]).toEqual({ type: "comment", text: "repetir 2x" });
  });

  it("expande tabulações", () => {
    const song = parseChordsOverLyrics("\tG\nSanto, santo");
    const line = song.sections[0].lines[0];
    expect(line.type === "lyrics" && line.segments[1]).toEqual({ chord: "G", lyric: "anto" });
  });

  it("lê metadados: autor e BPM", () => {
    const song = parseChordsOverLyrics("Grande É o Senhor\nTom: G\nAutor: Adhemar de Campos\nBPM: 72\n\n[Estrofe]\nG\nGrande é o Senhor");
    expect(song.meta).toEqual({
      title: "Grande É o Senhor",
      key: "G",
      artist: "Adhemar de Campos",
      tempo: "72",
    });
  });

  it("acordes colados são separados na exportação", () => {
    const text = serializeChordsOverLyrics({
      meta: {},
      sections: [
        {
          kind: "other",
          label: null,
          lines: [
            {
              type: "lyrics",
              segments: [
                { chord: "C#m7", lyric: "a" },
                { chord: "F#7", lyric: "mor" },
              ],
            },
          ],
        },
      ],
    });
    expect(text).toBe("C#m7 F#7\na    mor\n");
  });
});

describe("ChordPro", () => {
  it("aceita diretivas abreviadas e label=", () => {
    const song = parseChordPro(
      '{t: Exaltai}\n{key: E}\n{soc}\n[E]Exal[B]tai\n{eoc}\n{start_of_verse: label="Estrofe 1"}\n[A]Linha\n{end_of_verse}\n{c: Só piano}',
    );
    expect(song.meta).toEqual({ title: "Exaltai", key: "E" });
    expect(song.sections.map((s) => [s.kind, s.label])).toEqual([
      ["chorus", null],
      ["verse", "Estrofe 1"],
      ["other", null],
    ]);
    expect(song.sections[2].lines[0]).toEqual({ type: "comment", text: "Só piano" });
  });

  it("linha só de acordes", () => {
    const song = parseChordPro("[E] [D/E] | [A/E]");
    expect(song.sections[0].lines[0]).toEqual({ type: "chords", chords: ["E", "D/E", "|", "A/E"] });
  });
});

describe("parseFileName", () => {
  it("lê título, hinário e tom", () => {
    expect(parseFileName("Felicidade no Serviço - 410 CC - TOM E.docx")).toEqual({
      title: "Felicidade no Serviço",
      hymnNumber: 410,
      hymnal: "CC",
      key: "E",
    });
  });

  it("funciona sem hinário e com tom menor/acidente", () => {
    expect(parseFileName("Quem Sou Eu - TOM C#m.docx")).toEqual({
      title: "Quem Sou Eu",
      hymnNumber: null,
      hymnal: null,
      key: "C#m",
    });
    expect(parseFileName("Grande É o Senhor - Tom: Bb")).toMatchObject({ key: "Bb" });
    expect(parseFileName("Exaltai.docx")).toEqual({
      title: "Exaltai",
      hymnNumber: null,
      hymnal: null,
      key: null,
    });
  });
});
