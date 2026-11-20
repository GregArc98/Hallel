/* Hallel — service worker
 *
 * • Arquivos do app (/_next/static): guardados na primeira vez (nunca mudam de conteúdo).
 * • Páginas: sempre tenta a internet; se falhar, mostra a última versão salva.
 * • O app pede para salvar as páginas dos próximos cultos (mensagem "salvar"), junto
 *   com os arquivos que elas usam — assim abrem mesmo sem nunca terem sido visitadas.
 * • Áudios: só quando a pessoa toca em "Baixar áudios" (mensagem "audios"); depois o
 *   player toca do aparelho, com suporte a avançar/voltar (Range).
 * • Ao sair da conta, as páginas e áudios salvos são apagados (mensagem "limpar").
 */
const VERSAO = "v1";
const PAGINAS = `hallel-paginas-${VERSAO}`;
const ESTATICOS = `hallel-estaticos-${VERSAO}`;
const AUDIOS = `hallel-audios-${VERSAO}`;
const CACHES_ATUAIS = [PAGINAS, ESTATICOS, AUDIOS];
const OFFLINE = "/offline";
const NAO_GUARDAR = [/^\/entrar/, /^\/auth\//, /^\/api\//, /^\/sem-acesso/, /^\/redefinir-senha/, /^\/convite\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGINAS)
      .then((c) => c.add(new Request(OFFLINE, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith("hallel-") && !CACHES_ATUAIS.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function chavePagina(url) {
  const u = new URL(url);
  u.searchParams.delete("_rsc");
  u.hash = "";
  return u.toString();
}

function podeGuardar(url, resposta) {
  const u = new URL(url);
  return (
    resposta.ok &&
    !resposta.redirected &&
    (resposta.headers.get("content-type") || "").includes("text/html") &&
    !NAO_GUARDAR.some((re) => re.test(u.pathname))
  );
}

/** Arquivos /_next/static referenciados num HTML (scripts, estilos, fontes). */
function arquivosDoHtml(html) {
  const achados = new Set();
  for (const m of html.matchAll(/\/_next\/static\/[^"'\s\\)]+/g)) achados.add(m[0]);
  return [...achados];
}

async function guardarArquivos(caminhos) {
  const cache = await caches.open(ESTATICOS);
  await Promise.all(
    caminhos.map(async (p) => {
      if (await cache.match(p)) return;
      try {
        const r = await fetch(p);
        if (r.ok) await cache.put(p, r);
      } catch {
        /* sem rede: tenta de novo numa próxima vez */
      }
    }),
  );
}

async function paginaComFallback(request) {
  const chave = chavePagina(request.url);
  try {
    const resposta = await fetch(request);
    if (podeGuardar(request.url, resposta)) {
      const copia = resposta.clone();
      caches.open(PAGINAS).then((c) => c.put(chave, copia));
    }
    return resposta;
  } catch {
    const cache = await caches.open(PAGINAS);
    return (
      (await cache.match(chave)) ||
      (await cache.match(chave, { ignoreSearch: true })) ||
      (await cache.match(OFFLINE)) ||
      Response.error()
    );
  }
}

async function estaticoPrimeiroDoCache(request) {
  const cache = await caches.open(ESTATICOS);
  const salvo = await cache.match(request);
  if (salvo) return salvo;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

/** Áudio salvo no aparelho, respeitando pedidos de trecho (Range) do player. */
async function audioDoCache(request) {
  const cache = await caches.open(AUDIOS);
  const salvo = await cache.match(request.url);
  if (!salvo) return fetch(request);
  const range = request.headers.get("range");
  if (!range) return salvo;
  const corpo = await salvo.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const total = corpo.byteLength;
  let inicio = m && m[1] ? Number(m[1]) : 0;
  let fim = m && m[2] ? Number(m[2]) : total - 1;
  if (m && !m[1] && m[2]) {
    inicio = total - Number(m[2]);
    fim = total - 1;
  }
  return new Response(corpo.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      "Content-Type": salvo.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${inicio}-${fim}/${total}`,
      "Content-Length": String(fim - inicio + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname.endsWith(".blob.vercel-storage.com")) {
    event.respondWith(audioDoCache(request));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/soundtouch-processor.js" || url.pathname === "/signalsmith-stretch.mjs") {
    event.respondWith(estaticoPrimeiroDoCache(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(paginaComFallback(request));
    return;
  }
  // Navegação interna do Next (RSC): sem rede, falha logo para o navegador recarregar
  // a página inteira — e aí a versão salva é usada.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    event.respondWith(fetch(request).catch(() => Response.error()));
  }
});

async function salvarPaginas(urls) {
  const cache = await caches.open(PAGINAS);
  let salvas = 0;
  const arquivos = new Set();
  for (const caminho of urls) {
    const url = new URL(caminho, self.location.origin).toString();
    try {
      const r = await fetch(url, { credentials: "include" });
      if (!podeGuardar(url, r)) continue;
      const html = await r.clone().text();
      arquivosDoHtml(html).forEach((a) => arquivos.add(a));
      await cache.put(chavePagina(url), r);
      salvas++;
    } catch {
      /* sem rede */
    }
  }
  await guardarArquivos([...arquivos, "/soundtouch-processor.js", "/signalsmith-stretch.mjs"]);
  return { salvas };
}

async function salvarAudios(urls) {
  const cache = await caches.open(AUDIOS);
  let salvos = 0;
  for (const url of urls) {
    try {
      if (await cache.match(url)) {
        salvos++;
        continue;
      }
      const r = await fetch(url, { mode: "cors" });
      if (r.ok) {
        await cache.put(url, r);
        salvos++;
      }
    } catch {
      /* sem rede ou sem permissão */
    }
  }
  return { salvos, total: urls.length };
}

async function audiosSalvos(urls) {
  const cache = await caches.open(AUDIOS);
  const presentes = await Promise.all(urls.map((u) => cache.match(u).then(Boolean)));
  return { salvos: presentes.filter(Boolean).length, total: urls.length };
}

self.addEventListener("message", (event) => {
  const { tipo, urls = [] } = event.data || {};
  const responder = (dados) => event.ports[0] && event.ports[0].postMessage(dados);
  const tarefas = {
    salvar: () => salvarPaginas(urls),
    audios: () => salvarAudios(urls),
    "audios-salvos": () => audiosSalvos(urls),
    limpar: () => Promise.all([caches.delete(PAGINAS), caches.delete(AUDIOS)]).then(() => ({ ok: true })),
  };
  const tarefa = tarefas[tipo];
  if (tarefa) event.waitUntil(tarefa().then(responder, () => responder({ erro: true })));
});

// ---------------------------------------------------------------------------
// Avisos (Web Push): o servidor manda { titulo, corpo, url } quando a escala ou o
// repertório é publicado. Tocar na notificação abre o Hallel naquela página.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { corpo: event.data ? event.data.text() : "" };
  }
  const titulo = dados.titulo || "Hallel";
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: dados.url || "hallel",
      data: { url: dados.url || "/" },
      lang: "pt-BR",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  if (destino.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => new URL(j.url).origin === self.location.origin);
      if (aberta) {
        aberta.focus();
        return aberta.navigate(destino.href);
      }
      return self.clients.openWindow(destino.href);
    }),
  );
});
