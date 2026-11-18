import { describe, expect, it } from "vitest";

import { esquemaRepertorio, moverItem, tomDoCulto } from "../regras";

const ID = "2971bf35-258b-5583-94e5-eb4392a46a09";

describe("repertório", () => {
  it("move itens", () => {
    expect(moverItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moverItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moverItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });

  it("valida tons e observações", () => {
    expect(
      esquemaRepertorio.safeParse({ itens: [{ musica_id: ID, tom: "F#m", observacao: "repetir refrão 2x" }], observacoes: "" })
        .success,
    ).toBe(true);
    expect(esquemaRepertorio.safeParse({ itens: [{ musica_id: ID, tom: "H", observacao: "" }], observacoes: "" }).success).toBe(
      false,
    );
    expect(
      esquemaRepertorio.safeParse({ itens: [{ musica_id: "x", tom: "", observacao: "" }], observacoes: "" }).success,
    ).toBe(false);
  });

  it("tom do culto cai no original quando vazio", () => {
    expect(tomDoCulto(null, "E")).toBe("E");
    expect(tomDoCulto("G", "E")).toBe("G");
    expect(tomDoCulto(null, null)).toBeNull();
  });
});
