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
cp .env.example .env.local   # e preencha (ver "Variáveis de ambiente")
npm run dev                  # http://localhost:3000
```

Demonstração do visualizador de cifra (não precisa de banco): **/demo**.

Para testar no celular durante o desenvolvimento, rode `npm run dev` e
abra `http://IP-DO-COMPUTADOR:3000/demo` no celular (mesma rede Wi-Fi). Ou importe o
repositório na Vercel: cada push gera um link de pré-visualização.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo observação |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota do Next e roda o TypeScript |
| `npm run build` | Build de produção |
| `npm run test:db` | Aplica migrações + seed num Postgres local temporário e testa as regras de acesso (requer Postgres 15+ instalado) |
| `npm run db:seed:gerar` | Gera `supabase/seed.sql` a partir de `src/data/seed.ts` |

O CI (GitHub Actions) roda lint, typecheck, testes unitários, testes de banco e build a cada push.

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Na Vercel, cadastre as mesmas em
*Project → Settings → Environment Variables*.

| Variável | Onde achar | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API | Banco e login |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_…`) | Banco e login |
| `NEXT_PUBLIC_LOGIN_GOOGLE` | `1` para mostrar "Entrar com Google" | Opcional |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob (ver abaixo) | Upload dos áudios (opcional: sem ele, só links externos) |

As chaves `NEXT_PUBLIC_*` são públicas por natureza (vão para o navegador); quem
protege os dados são as regras de RLS do banco. **Nunca** coloque a chave
`service_role`/secret no app.

### Áudios (Vercel Blob)

1. Na Vercel: **Storage → Create → Blob**, dê um nome (ex.: `hallel-audios`) e conecte ao
   projeto. A Vercel cria a variável `BLOB_READ_WRITE_TOKEN` no projeto sozinha.
2. Para testar no computador, copie o valor (Storage → seu store → `.env.local`) para o
   seu `.env.local` e reinicie o `npm run dev`.

Como funciona: o navegador envia o arquivo **direto** para o Blob (não passa pelo
servidor); a rota `/api/audio/upload` só autoriza — apenas admins, apenas na pasta
`audios/<igreja>/`, até 25 MB, tipos de áudio. Os arquivos são públicos com nome
aleatório (impossível de adivinhar), o que permite tocar no `<audio>` e guardar offline.
Trocar ou remover o áudio de uma música apaga o arquivo antigo. Todo o acesso ao
provedor fica em `src/lib/storage/audio.ts` — trocar por R2/B2 mexe só ali e na rota.

## Banco de dados (Supabase)

- Migrações em `supabase/migrations/` (aplicar em ordem). Seed em `supabase/seed.sql`
  (para banco recém-criado).
- **Regras de acesso (RLS):** só integrantes ativos veem os dados da própria igreja;
  só admins alteram; membros veem só escalas/repertórios **publicados**;
  indisponibilidade só para a própria pessoa e admins; a igreja nunca fica sem admin.
- **Login só para cadastrados:** a conta é ligada ao integrante automaticamente pelo
  e-mail confirmado (gatilhos no banco), nos dois sentidos — cadastrar antes ou depois
  do primeiro login funciona. Quem entra sem cadastro vê "Peça ao líder".
- Excluir uma música (com confirmação) também a tira dos repertórios antigos em que apareceu.
- Tipos TypeScript em `src/lib/supabase/database.types.ts` (gerados pelo Supabase;
  gere de novo após mudar o esquema).

### Configuração do Supabase (uma vez)

1. **Authentication → URL Configuration**
   - *Site URL:* a URL de produção (ex.: `https://hallel.vercel.app`) ou `http://localhost:3000`.
   - *Redirect URLs:* `http://localhost:3000/**`, `http://*:3000/**` (rede local) e
     `https://*.vercel.app/**`.
2. **Primeiro admin** (SQL Editor), trocando nome e e-mail:
   ```sql
   update public.integrante set email = 'seu@email.com', papel = 'admin'
   where nome = 'Matheus';
   ```
   Depois é só entrar com esse e-mail. Os demais integrantes recebem o e-mail pelo
   app (etapa 5) ou pelo mesmo SQL (sem `papel = 'admin'`).
3. **(Recomendado) Link mágico que funciona em qualquer aparelho.** Por padrão o link
   só funciona no mesmo navegador em que foi pedido. Em *Authentication → Emails →
   Magic Link*, troque o link do modelo por:
   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Entrar no Hallel</a>
   ```
4. **(Opcional) Google:** crie um OAuth Client no Google Cloud (tipo *Web*, redirect
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`), ative o provedor em
   *Authentication → Sign In / Providers → Google* e use `NEXT_PUBLIC_LOGIN_GOOGLE=1`.
5. **E-mails:** o envio padrão do Supabase tem limite baixo por hora — suficiente para
   testes. Para a equipe toda, configure um SMTP próprio (ex.: Resend, plano grátis) em
   *Authentication → Emails → SMTP Settings*.

## Estrutura

```
src/
  app/                    rotas (Next.js App Router)
  components/ui/          componentes base no padrão shadcn/ui (Radix + Tailwind)
  components/chord-sheet/ visualizador de cifra (ChordSheet + SongViewer)
  app/(app)/              área logada (exige integrante cadastrado)
  app/(app)/musicas/      acervo: lista/busca, página da música, criar/editar (Server Actions)
  app/api/audio/upload/   autoriza o envio de áudio para o Vercel Blob
  app/entrar, app/auth/   login (link mágico / Google), retorno e saída
  hooks/                  preferências locais, tela sempre ligada, rolagem automática
  lib/auth.ts             sessão do usuário e igreja atual (Data Access Layer)
  lib/supabase/           clientes (servidor/navegador), proxy de sessão e tipos do banco
  proxy.ts                renova a sessão e manda quem não está logado para /entrar
  lib/music/              motor musical — isolado, sem dependências, 100% testado
  lib/musicas/            regras do acervo: validação do formulário, busca, links de áudio
  lib/storage/            armazenamento dos áudios (Vercel Blob)
  data/exemplos/          cifra real de exemplo (testes, demo e seed)
supabase/                 migrações e seed
scripts/                  gerador do seed e testes de banco
docs/PLANO.md             decisões, modelo de dados, telas e etapas
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

## Visualizador de cifra (`src/components/chord-sheet`)

- `ChordSheet` — renderiza a música já transposta: acorde em cima da sílaba, seções
  com rótulo e refrão destacado. Sem estado (serve no servidor e no cliente).
  Em telas estreitas a linha quebra **entre palavras**, nunca separando o acorde da
  sílaba (`layout.ts`, testado).
- `SongViewer` — controles: Cifra/Letra, tom −/+ (com "voltar ao tom do culto"),
  ♯ / Auto / ♭, tamanho da letra, rolagem automática (velocidade 1–10) e **modo
  palco** (tela cheia, escuro, tela sempre ligada via Wake Lock; sai com ✕ ou Esc).
- Tamanho da letra, ♯/♭ e velocidade ficam salvos no aparelho (`localStorage`).

> O CLI do shadcn não alcança o registro neste ambiente de desenvolvimento; os
> componentes de `components/ui` foram escritos no mesmo padrão (Radix + cva +
> tailwind-merge) e o `components.json` permite usar `npx shadcn add` normalmente
> em outra máquina.
