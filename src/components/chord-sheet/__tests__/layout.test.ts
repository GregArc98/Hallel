import { describe, expect, it } from "vitest";
import { segmentsToWords } from "../layout";

describe("segmentsToWords", () => {
  it("mantém o acorde junto da sílaba e quebra só entre palavras", () => {
    const words = segmentsToWords([
      { chord: null, lyric: "No serv" },
      { chord: "E", lyric: "iço do meu" },
    ]);
    expect(words).toEqual([
      [{ chord: null, text: "No " }],
      [
        { chord: null, text: "serv" },
        { chord: "E", text: "iço " },
      ],
      [{ chord: null, text: "do " }],
      [{ chord: null, text: "meu" }],
    ]);
  });

  it("acorde no fim da linha, sem letra", () => {
    expect(
      segmentsToWords([
        { chord: "E", lyric: "Rei " },
        { chord: "B7", lyric: "" },
      ]),
    ).toEqual([[{ chord: "E", text: "Rei " }], [{ chord: "B7", text: "" }]]);
  });

  it("acorde no meio da palavra continua na mesma palavra", () => {
    expect(
      segmentsToWords([
        { chord: "A", lyric: "Ale" },
        { chord: "D", lyric: "luia" },
      ]),
    ).toEqual([
      [
        { chord: "A", text: "Ale" },
        { chord: "D", text: "luia" },
      ],
    ]);
  });
});
