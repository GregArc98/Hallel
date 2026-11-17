import { describe, expect, it } from "vitest";
import {
  accidentalForKey,
  allKeys,
  parseKey,
  semitonesBetween,
  transposeChord,
  transposeKey,
  transposeToken,
} from "../transpose";

describe("transposeChord", () => {
  it("sobe 3 semitons (E → G), incluindo baixo invertido e extensões", () => {
    const up3 = (c: string) => transposeChord(c, 3);
    expect(up3("E")).toBe("G");
    expect(up3("F#m")).toBe("Am");
    expect(up3("B7")).toBe("D7");
    expect(up3("D/E")).toBe("F/G");
    expect(up3("E/G#")).toBe("G/B");
    expect(up3("E7/D")).toBe("G7/F");
    expect(up3("C#m")).toBe("Em");
    expect(up3("A#°")).toBe("C#°");
    expect(up3("F#m7(b5)")).toBe("Am7(b5)");
    expect(up3("Bbsus4")).toBe("Dbsus4");
  });

  it("respeita a preferência de sustenido ou bemol", () => {
    expect(transposeChord("E", 1, { accidental: "sharp" })).toBe("F");
    expect(transposeChord("D/E", 1, { accidental: "flat" })).toBe("Eb/F");
    expect(transposeChord("D/E", 1, { accidental: "sharp" })).toBe("D#/F");
    expect(transposeChord("A#°", 0, { accidental: "flat" })).toBe("Bb°");
  });

  it("no modo automático usa a grafia do tom de destino", () => {
    expect(transposeChord("B/A", 1, { targetKey: "F" })).toBe("C/Bb");
    expect(transposeChord("A#°", 1, { targetKey: "F" })).toBe("B°");
    expect(transposeChord("G#m", 0, { targetKey: "E" })).toBe("G#m");
    expect(transposeChord("C#m", 3, { targetKey: "G" })).toBe("Em");
  });

  it("sem tom de destino mantém a grafia original do acorde", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Eb", 1)).toBe("E");
    expect(transposeChord("Ab", 2)).toBe("Bb");
    expect(transposeChord("F#", 2)).toBe("G#");
  });

  it("transpõe para baixo e dá a volta na oitava", () => {
    expect(transposeChord("C", -1)).toBe("B");
    expect(transposeChord("E", -12)).toBe("E");
    expect(transposeChord("E", 13)).toBe("F");
  });

  it("devolve intacto o que não é acorde", () => {
    expect(transposeChord("Rei", 2)).toBe("Rei");
    expect(transposeToken("|", 2)).toBe("|");
    expect(transposeToken("(2x)", 2)).toBe("(2x)");
  });

  it("transpõe tokens com parênteses", () => {
    expect(transposeToken("(A", 2)).toBe("(B");
    expect(transposeToken("E)", 2)).toBe("F#)");
    expect(transposeToken("F#m7(b5)", 2)).toBe("G#m7(b5)");
  });

  it("aceita bemol e sustenido unicode", () => {
    expect(transposeChord("B♭", 2)).toBe("C");
    expect(transposeChord("C♯m", 1)).toBe("Dm");
  });
});

describe("tons", () => {
  it("parseKey", () => {
    expect(parseKey("E")).toEqual({ tonic: "E", minor: false });
    expect(parseKey("C#m")).toEqual({ tonic: "C#", minor: true });
    expect(parseKey("E7")).toBeNull();
    expect(parseKey("D/E")).toBeNull();
  });

  it("transposeKey escolhe a grafia convencional", () => {
    expect(transposeKey("E", 3)).toBe("G");
    expect(transposeKey("E", 1)).toBe("F");
    expect(transposeKey("E", 6)).toBe("Bb");
    expect(transposeKey("G", -1)).toBe("F#");
    expect(transposeKey("C", 3)).toBe("Eb");
    expect(transposeKey("Em", 3)).toBe("Gm");
    expect(transposeKey("Am", 4)).toBe("C#m");
    expect(transposeKey("E", 1, { accidental: "sharp" })).toBe("F");
    expect(transposeKey("C", 1, { accidental: "sharp" })).toBe("C#");
    expect(transposeKey("C", 1)).toBe("Db");
  });

  it("semitonesBetween escolhe o menor caminho", () => {
    expect(semitonesBetween("E", "G")).toBe(3);
    expect(semitonesBetween("E", "C")).toBe(-4);
    expect(semitonesBetween("C", "G")).toBe(-5);
    expect(semitonesBetween("G", "C#")).toBe(6);
    expect(semitonesBetween("E", "E")).toBe(0);
    expect(semitonesBetween("C#m", "Dbm")).toBe(0);
  });

  it("accidentalForKey", () => {
    expect(accidentalForKey("F")).toBe("flat");
    expect(accidentalForKey("E")).toBe("sharp");
    expect(accidentalForKey("Dm")).toBe("flat");
    expect(accidentalForKey("Gb")).toBe("flat");
    expect(accidentalForKey("F#")).toBe("sharp");
  });

  it("allKeys lista os 12 tons com grafia convencional", () => {
    expect(allKeys()).toEqual(["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]);
    expect(allKeys(true)).toEqual([
      "Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm",
    ]);
  });
});
