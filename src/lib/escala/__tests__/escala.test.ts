import { describe, expect, it } from "vitest";

import {
  chaveMes,
  dataCurta,
  domingosDoMes,
  hoje,
  lerMes,
  nomeDoMes,
  primeiroEUltimoDia,
  proximosDomingos,
  somarMeses,
} from "../datas";
import {
  analisarCulto,
  chaveVaga,
  compactar,
  contarEscalas,
  diferencaVagas,
  estaIndisponivel,
  lerVagas,
} from "../regras";

const BATERIA = "5a992a38-2b98-5ade-a093-1e61905f0ca4";
const VOCAL = "9b1cacf3-4a5b-534a-8c0e-f05fc308c36e";
const BRENO = "3371157f-2153-5e4e-9a40-e02641611ffc";
const SOFIA = "420bc3db-7ae8-5836-a68c-4229dd65f8c8";
const GRAZI = "5527f91a-abfb-513f-a3b6-7ca3400620ae";

describe("datas", () => {
  it("domingos do mês", () => {
    expect(domingosDoMes({ ano: 2026, mes: 11 })).toEqual([
      "2026-11-01",
      "2026-11-08",
      "2026-11-15",
      "2026-11-22",
      "2026-11-29",
    ]);
    expect(domingosDoMes({ ano: 2026, mes: 12 })).toEqual([
      "2026-12-06",
      "2026-12-13",
      "2026-12-20",
      "2026-12-27",
    ]);
  });

  it("meses: ler, navegar e limites", () => {
    expect(lerMes("2026-12", "2026-11-17")).toEqual({ ano: 2026, mes: 12 });
    expect(lerMes("lixo", "2026-11-17")).toEqual({ ano: 2026, mes: 11 });
    expect(lerMes("2026-13", "2026-11-17")).toEqual({ ano: 2026, mes: 11 });
    expect(somarMeses({ ano: 2026, mes: 12 }, 1)).toEqual({ ano: 2027, mes: 1 });
    expect(somarMeses({ ano: 2026, mes: 1 }, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(chaveMes({ ano: 2027, mes: 2 })).toBe("2027-02");
    expect(primeiroEUltimoDia({ ano: 2028, mes: 2 })).toEqual(["2028-02-01", "2028-02-29"]);
  });

  it("textos em português", () => {
    expect(nomeDoMes({ ano: 2026, mes: 12 })).toBe("dezembro de 2026");
    expect(dataCurta("2026-11-15")).toBe("Dom 15/11");
  });

  it("hoje no fuso de São Paulo (23h UTC ainda é o mesmo dia lá)", () => {
    expect(hoje("America/Sao_Paulo", new Date("2026-11-18T01:30:00Z"))).toBe("2026-11-17");
  });

  it("próximos domingos", () => {
    expect(proximosDomingos("2026-11-17", 3)).toEqual(["2026-11-22", "2026-11-29", "2026-12-06"]);
    expect(proximosDomingos("2026-11-22", 1)).toEqual(["2026-11-22"]);
  });
});

describe("vagas da escala", () => {
  const limites = new Map([
    [BATERIA, 1],
    [VOCAL, 3],
  ]);
  const integrantes = new Set([BRENO, SOFIA, GRAZI]);

  it("lê o formulário respeitando limites e cadastros", () => {
    const campos: [string, string][] = [
      [chaveVaga(BATERIA, 1), BRENO],
      [chaveVaga(BATERIA, 2), SOFIA], // acima do limite
      [chaveVaga(VOCAL, 1), ""], // vazia
      [chaveVaga(VOCAL, 2), SOFIA],
      [chaveVaga(VOCAL, 3), "00000000-0000-0000-0000-000000000000"], // desconhecido
    ];
    expect(lerVagas(campos, limites, integrantes)).toEqual([
      { funcaoId: BATERIA, posicao: 1, integranteId: BRENO },
      { funcaoId: VOCAL, posicao: 1, integranteId: SOFIA }, // subiu para a vaga 1
    ]);
  });

  it("compacta buracos", () => {
    expect(
      compactar([
        { funcaoId: VOCAL, posicao: 3, integranteId: GRAZI },
        { funcaoId: VOCAL, posicao: 1, integranteId: SOFIA },
      ]),
    ).toEqual([
      { funcaoId: VOCAL, posicao: 1, integranteId: SOFIA },
      { funcaoId: VOCAL, posicao: 2, integranteId: GRAZI },
    ]);
  });

  it("diferença: remove, insere e troca", () => {
    const atual = [
      { funcaoId: BATERIA, posicao: 1, integranteId: BRENO },
      { funcaoId: VOCAL, posicao: 1, integranteId: SOFIA },
      { funcaoId: VOCAL, posicao: 2, integranteId: GRAZI },
    ];
    const desejado = [
      { funcaoId: BATERIA, posicao: 1, integranteId: BRENO }, // igual
      { funcaoId: VOCAL, posicao: 1, integranteId: GRAZI }, // troca
    ];
    expect(diferencaVagas(atual, desejado)).toEqual({
      remover: [{ funcaoId: VOCAL, posicao: 2, integranteId: GRAZI }],
      gravar: [{ funcaoId: VOCAL, posicao: 1, integranteId: GRAZI }],
    });
  });
});

describe("alertas", () => {
  const funcoes = [{ id: BATERIA }, { id: VOCAL }];
  const culto = {
    id: "c1",
    data: "2026-11-22",
    periodo: "noite" as const,
    vagas: [
      { funcaoId: BATERIA, posicao: 1, integranteId: BRENO },
      { funcaoId: VOCAL, posicao: 1, integranteId: BRENO },
    ],
  };

  it("indisponibilidade por período ou dia todo", () => {
    const lista = [{ integranteId: SOFIA, data: "2026-11-22", periodo: null }];
    expect(estaIndisponivel(SOFIA, "2026-11-22", "manha", lista)).toBe(true);
    expect(estaIndisponivel(SOFIA, "2026-11-22", "noite", lista)).toBe(true);
    expect(estaIndisponivel(SOFIA, "2026-11-29", "noite", lista)).toBe(false);
    expect(
      estaIndisponivel(BRENO, "2026-11-22", "manha", [{ integranteId: BRENO, data: "2026-11-22", periodo: "noite" }]),
    ).toBe(false);
  });

  it("aponta repetido, indisponível, outro culto no mesmo horário e função vazia", () => {
    const avulso = {
      id: "c2",
      data: "2026-11-22",
      periodo: "noite" as const,
      vagas: [{ funcaoId: BATERIA, posicao: 1, integranteId: BRENO }],
    };
    const alertas = analisarCulto(
      { ...culto, vagas: culto.vagas.slice(0, 1) },
      funcoes,
      [{ integranteId: BRENO, data: "2026-11-22", periodo: "noite" }],
      [avulso],
    );
    expect(alertas).toEqual({
      funcoesVazias: [VOCAL],
      repetidos: [],
      indisponiveis: [BRENO],
      outroCulto: [BRENO],
    });
    expect(analisarCulto(culto, funcoes, [], []).repetidos).toEqual([BRENO]);
  });

  it("conta escalas por pessoa (uma vez por culto)", () => {
    const outro = { ...culto, id: "c3", vagas: [{ funcaoId: VOCAL, posicao: 1, integranteId: SOFIA }] };
    expect(contarEscalas([culto, outro])).toEqual(new Map([[BRENO, 1], [SOFIA, 1]]));
  });
});
