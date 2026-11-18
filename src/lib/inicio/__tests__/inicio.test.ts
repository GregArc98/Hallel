import { describe, expect, it } from "vitest";

import { indiceValido, minhasEscalas, pendencias } from "../regras";

const EU = "eu";
const base = { horario: null, escalaPublicada: true, repertorioPublicado: true, musicas: 3 };
const cultos = [
  { ...base, id: "a", data: "2026-11-15", periodo: "noite" as const, vagas: [{ funcaoId: "baixo", posicao: 1, integranteId: EU }] },
  { ...base, id: "c", data: "2026-11-22", periodo: "noite" as const, vagas: [{ funcaoId: "baixo", posicao: 1, integranteId: EU }, { funcaoId: "vocal", posicao: 1, integranteId: EU }] },
  { ...base, id: "b", data: "2026-11-22", periodo: "manha" as const, vagas: [{ funcaoId: "baixo", posicao: 1, integranteId: "outro" }], escalaPublicada: false, musicas: 0 },
];

describe("início", () => {
  it("minhas escalas a partir de hoje, em ordem, com funções", () => {
    expect(minhasEscalas(cultos, EU, "2026-11-17")).toEqual([{ culto: cultos[1], funcoes: ["baixo", "vocal"] }]);
  });

  it("pendências dos próximos cultos", () => {
    expect(pendencias(cultos, [{ id: "baixo" }, { id: "vocal" }], "2026-11-17")).toEqual([
      { cultoId: "b", data: "2026-11-22", periodo: "manha", itens: ["1 função sem ninguém", "escala não publicada", "sem repertório"] },
    ]);
  });

  it("índice do modo culto", () => {
    expect(indiceValido("2", 6)).toBe(2);
    expect(indiceValido("9", 6)).toBe(0);
    expect(indiceValido("x", 6)).toBe(0);
    expect(indiceValido(undefined, 6)).toBe(0);
  });
});
