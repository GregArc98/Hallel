/** Normaliza o termo de busca como o banco faz (sem acento, minúsculas). */
export function normalizarBusca(termo: string): string {
  return termo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Padrão para ILIKE com curingas escapados: "50%" não vira "qualquer coisa". */
export function padraoContem(termo: string): string {
  const escapado = normalizarBusca(termo).replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escapado}%`;
}
