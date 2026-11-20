import { describe, expect, it } from "vitest";

import { dadosDoCadastro, mensagemDoErro, normalizarEmail, problemaNaSenha } from "../senha";

describe("problemaNaSenha", () => {
  it("exige o tamanho mínimo e máximo", () => {
    expect(problemaNaSenha("1234567")).toMatch(/pelo menos 8/);
    expect(problemaNaSenha("12345678")).toBeNull();
    expect(problemaNaSenha("x".repeat(73))).toMatch(/no máximo 72/);
  });

  it("confere a repetição", () => {
    expect(problemaNaSenha("senha-boa-1", "senha-boa-2")).toMatch(/não são iguais/);
    expect(problemaNaSenha("senha-boa-1", "senha-boa-1")).toBeNull();
  });
});

describe("mensagemDoErro", () => {
  it("traduz os erros comuns", () => {
    expect(mensagemDoErro({ code: "invalid_credentials", status: 400 }, "entrar")).toMatch(/incorretos/);
    expect(mensagemDoErro({ code: "email_not_confirmed" }, "entrar")).toMatch(/confirmar seu e-mail/);
    expect(mensagemDoErro({ code: "over_email_send_rate_limit" }, "recuperar")).toMatch(/Muitas tentativas/);
    expect(mensagemDoErro({ status: 429 }, "cadastro")).toMatch(/Muitas tentativas/);
    expect(mensagemDoErro({ code: "same_password" }, "nova-senha")).toMatch(/diferente/);
  });

  it("entende erros que vêm só com a mensagem", () => {
    expect(mensagemDoErro({ status: 400, message: "Invalid login credentials" }, "entrar")).toMatch(/incorretos/);
    expect(mensagemDoErro({ message: "Email not confirmed" }, "entrar")).toMatch(/confirmar/);
  });

  it("tem mensagem genérica para cada momento", () => {
    expect(mensagemDoErro({ message: "x" }, "cadastro")).toMatch(/criar sua conta/);
    expect(mensagemDoErro({}, "nova-senha")).toMatch(/nova senha/);
  });
});

describe("dadosDoCadastro", () => {
  it("lê nome, telefone e convite válidos", () => {
    expect(dadosDoCadastro({ nome: " Sofia ", telefone: "11 9", convite: "abc12345" })).toEqual({
      nome: "Sofia",
      telefone: "11 9",
      convite: "abc12345",
    });
  });

  it("ignora valores estranhos", () => {
    expect(dadosDoCadastro(null)).toEqual({});
    expect(dadosDoCadastro({ nome: 3, convite: "../x" })).toEqual({ nome: undefined, telefone: undefined, convite: undefined });
  });
});

it("normalizarEmail", () => {
  expect(normalizarEmail("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
});
