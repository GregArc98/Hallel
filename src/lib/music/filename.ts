/**
 * Extrai dados do nome de arquivo das cifras no Drive.
 * "Felicidade no Serviço - 410 CC - TOM E.docx"
 *   → { title: "Felicidade no Serviço", hymnNumber: 410, hymnal: "CC", key: "E" }
 */

export interface FileNameInfo {
  title: string;
  key: string | null;
  hymnNumber: number | null;
  hymnal: string | null;
}

const KEY_RE = /\bTOM\s*[:\-]?\s*([A-G])(#|b|♯|♭)?(m(?:in)?)?(?![A-Za-z#])/i;
const HYMN_RE = /^(\d{1,4})\s*([A-Z]{1,5})?$/i;

export function parseFileName(fileName: string): FileNameInfo {
  const base = fileName.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
  const parts = base.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);

  let key: string | null = null;
  let hymnNumber: number | null = null;
  let hymnal: string | null = null;
  const titleParts: string[] = [];

  for (const part of parts) {
    const k = KEY_RE.exec(part);
    if (k && !key) {
      const acc = (k[2] ?? "").replace("♯", "#").replace("♭", "b");
      key = `${k[1].toUpperCase()}${acc}${k[3] ? "m" : ""}`;
      continue;
    }
    const h = HYMN_RE.exec(part);
    if (h && hymnNumber === null) {
      hymnNumber = Number(h[1]);
      hymnal = h[2] ? h[2].toUpperCase() : null;
      continue;
    }
    titleParts.push(part);
  }

  return { title: titleParts.join(" - "), key, hymnNumber, hymnal };
}
