import { describe, expect, it } from "vitest";

import {
  chaveFuncao,
  diferencaFuncoes,
  esquemaFuncao,
  lerFuncoesMarcadas,
  mensagemErroIntegrante,
  prepararIntegrante,
} from "../formulario";

const BATERIA = "5a992a38-2b98-5ade-a093-1e61905f0ca4";
const VOCAL = "9b1cacf3-4a5b-534a-8c0e-f05fc308c36e";
const ESTRANHA = "00000000-0000-0000-0000-000000000000";

describe("grade função × período", () => {
  it("lê só as caixinhas de funções conhecidas", () => {
    const campos: [string, string][] = [
      [chaveFuncao(BATERIA, "manha"), "on"],
      [chaveFuncao(VOCAL, "noite"), "on"],
      [chaveFuncao(ESTRANHA, "noite"), "on"],
      ["funcao:lixo:noite", "on"],
      ["nome", "Breno"],
    ];
    expect(lerFuncoesMarcadas(campos, new Set([BATERIA, VOCAL]))).toEqual([
      { funcaoId: BATERIA, periodo: "manha" },
      { funcaoId: VOCAL, periodo: "noite" },
    ]);
  });

  it("calcula o que inserir e remover", () => {
    const atual = [
      { funcaoId: BATERIA, periodo: "manha" as const },
      { funcaoId: BATERIA, periodo: "noite" as const },
    ];
    const desejado = [
      { funcaoId: BATERIA, periodo: "noite" as const },
      { funcaoId: VOCAL, periodo: "manha" as const },
    ];
    expect(diferencaFuncoes(atual, desejado)).toEqual({
      inserir: [{ funcaoId: VOCAL, periodo: "manha" }],
      remover: [{ funcaoId: BATERIA, periodo: "manha" }],
    });
  });
});

describe("prepararIntegrante", () => {
  const base = { nome: "Sofia", email: "", telefone: "", papel: "membro", ativo: true };

  it("normaliza e-mail e aceita campos vazios", () => {
    const r = prepararIntegrante({ ...base, email: "  Sofia@Exemplo.COM " });
    expect(r).toEqual({
      ok: true,
      dados: { nome: "Sofia", email: "sofia@exemplo.com", telefone: null, papel: "membro", ativo: true },
    });
  });

  it("valida nome, e-mail e papel", () => {
    const r = prepararIntegrante({ ...base, nome: " ", email: "sofia@", papel: "chefe" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros).sort()).toEqual(["email", "nome", "papel"]);
  });

  it("traduz erros do banco", () => {
    expect(mensagemErroIntegrante({ code: "23505", message: "duplicate key" })).toMatch(/e-mail/);
    expect(
      mensagemErroIntegrante({ code: "23514", message: "A igreja precisa ter pelo menos um admin ativo" }),
    ).toMatch(/pelo menos um líder/);
  });
});

describe("esquemaFuncao", () => {
  it("aceita função válida e rejeita limites fora da faixa", () => {
    expect(esquemaFuncao.safeParse({ nome: "Violão", max_por_culto: "2", modo_padrao: "cifra" }).success).toBe(true);
    expect(esquemaFuncao.safeParse({ nome: "Violão", max_por_culto: "0", modo_padrao: "cifra" }).success).toBe(false);
    expect(esquemaFuncao.safeParse({ nome: "", max_por_culto: "1", modo_padrao: "letra" }).success).toBe(false);
  });
});
