# Hallel — plano do MVP

Documento vivo com as decisões aprovadas. Atualize ao mudar o escopo.

## Decisões

| Tema | Decisão |
|---|---|
| Stack | Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui; Supabase (Postgres, Auth, RLS); deploy na Vercel |
| Áudios | **Vercel Blob** (Hobby: ~1 GB de espaço, ~10 GB de tráfego/mês, sem cartão). Arquivos públicos com nome aleatório; upload direto do navegador autorizado só para admins. Acesso isolado em `lib/storage` para trocar por R2/B2 |
| Login | Google ou link mágico por e-mail. **Só e-mails cadastrados** por um admin entram; no 1º login a conta é vinculada ao integrante pelo e-mail |
| Papéis | `admin` (líder e co-líderes) e `membro`, guardados no integrante |
| Multi-igreja | `igreja_id` em todas as tabelas (tenant); seletor de igreja só aparece se a pessoa estiver em mais de uma |
| Visibilidade | Membro vê a escala completa (só leitura) e apenas escalas/repertórios **publicados**. Indisponibilidade só para a própria pessoa e admins |
| Conflitos | Avisos, não bloqueios (ex.: mesma pessoa em duas funções no culto) |
| Excluir música | Permitido sempre (com confirmação). A música também sai dos repertórios antigos em que apareceu |
| Cifras | Armazenadas em **ChordPro**. O usuário cola/edita no formato "acorde em cima da letra" e o app converte nos dois sentidos |
| Offline | Setlists dos próximos cultos do membro (cifras, letras, transposição) + botão "baixar áudios deste culto" |
| Nomes | Tabelas/colunas de domínio em português sem acento; código genérico em inglês |
| Supabase | Projeto em São Paulo (sa-east-1). Funções de permissão no schema `privado` (fora da API) |
| Cache Components | Desativado: quase toda tela depende do usuário logado; simplicidade > ganho marginal |
| Git | Uma branch por etapa (`etapa-N/...`), commits no padrão Conventional Commits, PR para `main` |

## Modelo de dados

```
igreja ─┬─< integrante >── auth.users (usuario_id, preenchido no 1º login)
        │       ├─< integrante_funcao >── funcao
        │       └─< indisponibilidade
        ├─< funcao
        ├─< musica
        └─< culto ─┬─< escala_item  >── funcao, integrante
                   └─< setlist_item >── musica
```

| Tabela | Campos principais |
|---|---|
| igreja | nome, slug, fuso_horario |
| integrante | igreja_id, usuario_id?, nome, email, telefone, papel (`admin`/`membro`), ativo |
| funcao | igreja_id, nome, ordem, max_por_culto (Vocal = 3), modo_padrao (`cifra`/`letra`) |
| integrante_funcao | integrante_id, funcao_id, periodo (`manha`/`noite`) — PK composta |
| musica | titulo, artista, hinario_numero, hinario_sigla, tom_original, bpm, tags[], cifra (ChordPro), letra (gerada da cifra pelo app, ou digitada), audio_url, audio_url_externo, youtube_url, busca (texto sem acento + índice trigram) |
| culto | data, periodo, tipo (`regular`/`avulso`), titulo, horario, observacoes, escala_publicada, repertorio_publicado, publicado_em |
| escala_item | culto_id, funcao_id, integrante_id, posicao — único (culto, função, posição) |
| setlist_item | culto_id, musica_id, ordem, tom, observacao |
| indisponibilidade | integrante_id, data, periodo? (vazio = dia todo), motivo |

Preparado para a fase 2 (não implementado): publicação centralizada numa única função
(gancho para notificações), coluna de confirmação em `escala_item`, token público em
`culto`, estatísticas a partir de `setlist_item`, importador do Drive reaproveitando
`src/lib/music` (`parseChordsOverLyrics`, `parseFileName`).

## Telas

**Membro:** Entrar · Início (próximo culto + setlist + minhas escalas do mês) · Culto
(escala, repertório, ▶ Modo culto) · Visualizador de cifra (tom, ♯/♭, cifra/letra,
fonte, rolagem, modo palco, player) · Músicas (busca/filtros) · Escala do mês ·
Minha disponibilidade · Perfil.

**Admin (além do acima):** Início com pendências · Música criar/editar (colar cifra →
prévia, detecção de tom, upload de áudio) · Equipe (grade função × manhã/noite) ·
Escala (gerar domingos, culto avulso, sugestões por função/período, indisponíveis e
conflitos, publicar mês) · Repertório (arrastar, tom por culto, observações,
publicar) · Configurações (igreja, funções, tags).

Navegação: barra inferior no celular (Início · Escala · Músicas · Mais), lateral no desktop.

## Etapas

| # | Etapa | Status |
|---|---|---|
| 0 | Base: Next.js, Tailwind, Vitest, lint, CI | ✅ |
| 1 | Motor musical (`src/lib/music`) com testes | ✅ |
| 2 | Visualizador de cifra (sem banco) — `/demo` | ✅ |
| 3 | Supabase: schema, RLS, seed, auth | ✅ |
| 4 | Acervo de músicas + editor de cifra + áudio | ✅ |
| 5 | Equipe e funções | ⏳ |
| 6 | Escala + indisponibilidade | |
| 7 | Repertório do culto | |
| 8 | Início do membro + Modo culto | |
| 9 | PWA + offline | |
| 10 | Polimento + deploy | |
