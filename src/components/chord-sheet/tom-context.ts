"use client";

import { createContext } from "react";

/** Semitons que a cifra está transposta em relação ao tom original (null = fora do visualizador). */
export const TomDaCifra = createContext<number | null>(null);
