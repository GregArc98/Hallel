# Hallel

Plataforma web (mobile-first, instalável como PWA) para organizar o ministério de
louvor: acervo de músicas com cifra inteligente, equipe, escalas e repertório de
cada culto.

- **Líder/Admin:** gerencia músicas, equipe, escalas e repertórios.
- **Membro:** abre o app e vê o próximo culto em que está escalado, as músicas, o
  tom, a cifra já transposta e o áudio.

Plano, modelo de dados e decisões: [`docs/PLANO.md`](docs/PLANO.md).

## Como rodar

Requisitos: Node.js 20.9+ (recomendado 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota do Next e roda o TypeScript |
| `npm run build` | Build de produção |

O CI (GitHub Actions) roda lint, typecheck, testes e build a cada push.

## Variáveis de ambiente

Ainda nenhuma. Entram nas próximas etapas (um `.env.example` será adicionado):

| Variável | Etapa | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 3 | Banco e login |
| `BLOB_READ_WRITE_TOKEN` | 4 | Upload dos áudios (Vercel Blob) |

## Estrutura

```
src/
  app/              rotas (Next.js App Router)
  lib/music/        motor musical — isolado, sem dependências, 100% testado
docs/PLANO.md       decisões, modelo de dados, telas e etapas
```

## Motor musical (`src/lib/music`)

Módulo puro em TypeScript, sem dependências de UI ou banco, usado pelo app e,
na fase 2, pelo importador do Google Drive.

| Arquivo | Responsabilidade |
|---|---|
| `notes.ts` | Notas, semitons, grafia ♯/♭ |
| `chord.ts` | Leitura de acordes: raiz, sufixo e baixo (`E7/D`, `F#m7(b5)`, `A#°`, `Bbsus4`) |
| `transpose.ts` | Transposição de acordes e tons; grafia automática pelo tom de destino ou forçada (♯/♭) |
| `song.ts` | Estrutura interna (seções → linhas → segmentos acorde+letra) |
| `chords-over-lyrics.ts` | Converte o formato "acorde em cima da letra" (como no Word) ⇄ estrutura |
| `chordpro.ts` | Converte ChordPro (formato salvo no banco) ⇄ estrutura |
| `filename.ts` | Lê título, hinário e tom do nome do arquivo (`Felicidade no Serviço - 410 CC - TOM E.docx`) |

```ts
import { parseSongText, serializeChordPro, transposeSongToKey } from "@/lib/music";

const song = parseSongText(textoColadoDoWord);          // detecta o formato sozinho
const paraSalvar = serializeChordPro(song);             // vai para o banco
const noTomDoCulto = transposeSongToKey(song, "E", "G"); // E → G, F#m → Am, E/G# → G/B
```

### Decisões do motor

- **Alinhamento por coluna.** No formato "acorde em cima", o acorde cai sobre o
  caractere da mesma coluna. No Word com fonte proporcional (ex.: Century Gothic) o
  alinhamento visual não bate com a contagem de caracteres — por isso o editor do app
  usa fonte monoespaçada e sempre mostra a prévia antes de salvar.
- **Seções** como `[Intro]`, `[Estrofe 1]`, `[Refrão]` são reconhecidas pelo nome (não
  são confundidas com acordes) e mapeadas para tipos (`intro`, `verse`, `chorus`...).
- **Grafia ♯/♭ automática:** tons F, Bb, Eb, Ab, Db (e Dm, Gm, Cm, Fm, Bbm, Ebm) usam
  bemóis; os demais, sustenidos. F# é preferido a Gb. Transpor 0 semitons não muda nada.
- **Diminuto** aceito como `°`, `º`, `o` ou `dim`.
- Teste de referência com a cifra real de *Felicidade no Serviço*
  (`src/lib/music/__fixtures__`).
