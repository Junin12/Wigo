// Guarda o app no aparelho para abrir sem internet.
// Ao alterar index.html, suba o número da versão para os celulares receberem a atualização.
// Os PDFs dos projetos ficam num cache à parte ("armacao-pdfs"), que não é apagado nas atualizações.
const VERSAO = "armacao-v12";
const APP = ["./", "index.html", "painel.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "logo-heca.webp"];
const LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSAO);
    await c.addAll(APP);
    for (const u of LIBS) { try { await c.add(u); } catch {} } // se falhar, baixa no primeiro uso
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("armacao-v") && k !== VERSAO) await caches.delete(k);
    self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || !url.protocol.startsWith("http")) return;
  if (url.hostname.endsWith("script.google.com") || url.hostname.endsWith("googleusercontent.com")) return; // banco: sempre rede

  // Páginas e arquivos do app: responde do cache na hora e atualiza em segundo plano
  e.respondWith((async () => {
    const c = await caches.open(VERSAO);
    const hit = await c.match(req, { ignoreSearch: url.origin === location.origin });
    const rede = fetch(req).then(r => {
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(rede); return hit; }
    const r = await rede;
    if (r) return r;
    if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
    return Response.error();
  })());
});
