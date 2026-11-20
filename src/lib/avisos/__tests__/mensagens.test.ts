import { describe, expect, it } from "vitest";

import {
  type CultoDoAviso,
  type Escalacao,
  avisosDeEscala,
  avisosDeRepertorio,
  linkWhatsapp,
  listaPt,
  rotuloCulto,
  textoWhatsappEscala,
  textoWhatsappRepertorio,
} from "../mensagens";

const BASE = "https://hallel.exemplo";
const c1: CultoDoAviso = { id: "c1", data: "2026-11-15", periodo: "noite", titulo: null, horario: "19:30:00" };
const c2: CultoDoAviso = { id: "c2", data: "2026-11-01", periodo: "manha", titulo: "Santa Ceia", horario: null };

const esc = (integranteId: string, nome: string, cultoId: string, funcao: string, ordem: number, email: string | null = null): Escalacao => ({
  integranteId,
  nome,
  email,
  cultoId,
  funcao,
  ordem,
});

describe("rótulos", () => {
  it("listaPt", () => {
    expect(listaPt([])).toBe("");
    expect(listaPt(["Vocal"])).toBe("Vocal");
    expect(listaPt(["Vocal", "Violão"])).toBe("Vocal e Violão");
    expect(listaPt(["a", "b", "c"])).toBe("a, b e c");
  });

  it("rotuloCulto com horário e título", () => {
    expect(rotuloCulto(c1)).toBe("Dom 15/11 · Noite (19:30)");
    expect(rotuloCulto(c2)).toBe("Dom 01/11 · Manhã — Santa Ceia");
  });
});

describe("avisosDeEscala", () => {
  it("um culto: abre o culto e lista as funções em ordem", () => {
    const [a] = avisosDeEscala([c1], [esc("i1", "Sofia Ribeiro", "c1", "Violão", 3, "s@x"), esc("i1", "Sofia Ribeiro", "c1", "Vocal", 1, "s@x")], BASE);
    expect(a.titulo).toBe("Você está na escala");
    expect(a.corpo).toBe("Dom 15/11 · Noite (19:30): Vocal e Violão");
    expect(a.url).toBe("/culto/c1");
    expect(a.email).toBe("s@x");
    expect(a.texto).toContain("Olá, Sofia!");
    expect(a.texto).toContain(`${BASE}/culto/c1`);
    expect(a.texto).toContain("Perfil → Avisos");
  });

  it("vários cultos: um aviso só, em ordem de data, abrindo o Início", () => {
    const avisos = avisosDeEscala([c1, c2], [esc("i1", "Breno", "c1", "Bateria", 5), esc("i1", "Breno", "c2", "Bateria", 5), esc("i2", "Ana", "c2", "Vocal", 1)], BASE);
    expect(avisos).toHaveLength(2);
    const breno = avisos.find((a) => a.nome === "Breno")!;
    expect(breno.titulo).toBe("Você está na escala de 2 cultos");
    expect(breno.corpo.split("\n")[0]).toMatch(/^Dom 01\/11/);
    expect(breno.url).toBe("/");
  });

  it("ignora cultos que não estão na lista", () => {
    expect(avisosDeEscala([c1], [esc("i1", "Ana", "outro", "Vocal", 1)], BASE)).toEqual([]);
  });
});

describe("avisosDeRepertorio", () => {
  const musicas = [
    { titulo: "Felicidade no Serviço", tom: "G" },
    { titulo: "Grandioso És Tu", tom: null },
    { titulo: "Castelo Forte", tom: "C" },
    { titulo: "Porque Ele Vive", tom: "A" },
  ];

  it("resume as músicas e lista todas no e-mail", () => {
    const [a] = avisosDeRepertorio(c1, musicas, [esc("i1", "Ana", "c1", "Vocal", 1), esc("i1", "Ana", "c1", "Violão", 2)], BASE);
    expect(a.titulo).toBe("Repertório publicado");
    expect(a.corpo).toBe("Dom 15/11 · Noite (19:30)\nFelicidade no Serviço, Grandioso És Tu, Castelo Forte e mais 1");
    expect(a.texto).toContain("4. Porque Ele Vive (A)");
    expect(a.texto).toContain("2. Grandioso És Tu\n");
  });

  it("só para quem está naquele culto", () => {
    expect(avisosDeRepertorio(c1, musicas, [esc("i1", "Ana", "c2", "Vocal", 1)], BASE)).toEqual([]);
  });
});

describe("WhatsApp", () => {
  it("escala do mês agrupada por função", () => {
    const texto = textoWhatsappEscala(
      "Escala de novembro",
      [
        { ...c1, vagas: [{ funcao: "Vocal", ordem: 1, posicao: 2, nome: "Sofia" }, { funcao: "Vocal", ordem: 1, posicao: 1, nome: "Ana" }, { funcao: "Bateria", ordem: 5, posicao: 1, nome: "Breno" }] },
        { ...c2, vagas: [] },
      ],
      `${BASE}/escala`,
    );
    expect(texto).toBe(
      "🎵 *Escala de novembro*\n\n*Dom 01/11 · Manhã — Santa Ceia*\n(ainda sem escala)\n\n*Dom 15/11 · Noite (19:30)*\nVocal: Ana e Sofia\nBateria: Breno\n\nVeja no Hallel: https://hallel.exemplo/escala",
    );
  });

  it("repertório numerado com tom", () => {
    expect(textoWhatsappRepertorio(c1, [{ titulo: "A", tom: "G" }, { titulo: "B", tom: null }], "u")).toBe(
      "🎵 *Repertório — Dom 15/11 · Noite (19:30)*\n\n1. A (G)\n2. B\n\nCifras e áudios no Hallel: u",
    );
  });

  it("link codificado", () => {
    expect(linkWhatsapp("Oi & tchau")).toBe("https://wa.me/?text=Oi%20%26%20tchau");
  });
});
