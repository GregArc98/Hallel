import { describe, expect, it } from "vitest";
import { isChord, isChordLineFiller, isChordToken, parseChord } from "../chord";

describe("parseChord", () => {
  it.each([
    ["E", { root: "E", suffix: "", bass: null }],
    ["F#m", { root: "F#", suffix: "m", bass: null }],
    ["B7", { root: "B", suffix: "7", bass: null }],
    ["D/E", { root: "D", suffix: "", bass: "E" }],
    ["E/G#", { root: "E", suffix: "", bass: "G#" }],
    ["E7/D", { root: "E", suffix: "7", bass: "D" }],
    ["A#°", { root: "A#", suffix: "°", bass: null }],
    ["Bbsus4", { root: "Bb", suffix: "sus4", bass: null }],
    ["F#m7(b5)", { root: "F#", suffix: "m7(b5)", bass: null }],
    ["C7M", { root: "C", suffix: "7M", bass: null }],
    ["Cmaj7", { root: "C", suffix: "maj7", bass: null }],
    ["Gadd9", { root: "G", suffix: "add9", bass: null }],
    ["A7/9", { root: "A", suffix: "7/9", bass: null }],
    ["Am7/G", { root: "A", suffix: "m7", bass: "G" }],
    ["Csus4/G", { root: "C", suffix: "sus4", bass: "G" }],
    ["E7(#9)", { root: "E", suffix: "7(#9)", bass: null }],
    ["C♯m", { root: "C#", suffix: "m", bass: null }],
    ["B♭", { root: "Bb", suffix: "", bass: null }],
  ])("%s", (text, expected) => {
    expect(parseChord(text)).toEqual(expected);
  });

  it.each(["Bº", "Bo", "B°", "Bdim", "C+", "Caug", "D4", "A(9)", "G#m7"])(
    "aceita %s",
    (text) => expect(isChord(text)).toBe(true),
  );

  it.each(["", "H", "Rei", "No", "serviço", "C(9", "Am7b5x", "E/H", "[Refrão]", "e"])(
    "rejeita %j",
    (text) => expect(isChord(text)).toBe(false),
  );
});

describe("tokens de linha de acordes", () => {
  it("aceita acordes entre parênteses", () => {
    expect(isChordToken("(A")).toBe(true);
    expect(isChordToken("B)")).toBe(true);
    expect(isChordToken("(E7)")).toBe(true);
  });

  it("reconhece marcas que não são acordes", () => {
    for (const t of ["|", "||", "x2", "2x", "(2x)", "-", "%"]) {
      expect(isChordLineFiller(t)).toBe(true);
    }
    expect(isChordLineFiller("Rei")).toBe(false);
  });
});
