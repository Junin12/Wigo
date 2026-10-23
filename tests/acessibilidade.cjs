// Acessibilidade (axe-core): abre as telas principais no tamanho de celular e lista o que o axe aponta
// (contraste, botão sem nome, campo sem rótulo…). Por enquanto só avisa: não impede a publicação.
// Uso: node tests/acessibilidade.cjs   (precisa dos pacotes "playwright" e "axe-core")
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" }); r.end(b); });
});
const GH = !!process.env.GITHUB_ACTIONS;
(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const nav = await chromium.launch();
  let total = 0; const porRegra = new Map();
  for (const tema of ["light", "dark"]) {
  const ctx = await nav.newContext({ ...devices["Pixel 7"], serviceWorkers: "block", colorScheme: tema });
  await ctx.route(/script\.google(usercontent)?\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(base + "index.html"); await p.waitForTimeout(800);
  await p.evaluate(() => { const u = { nome: "Teste", cargo: "Gerente de obra" };
    localStorage.setItem("arm:usuario", JSON.stringify(u)); localStorage.setItem("arm:acesso", JSON.stringify({ status: "liberado", ...u }));
    localStorage.setItem("arm:tour:Gerente de obra", "1"); });
  await p.reload(); await p.waitForTimeout(1500);
  const telas = [["Início", () => abrirTela("inicio")], ["Produção", () => abrirTela("producao")], ["Ponto", () => abrirTela("ponto")],
    ["Fotos", () => abrirTela("fotos")], ["RDO", () => abrirTela("rdo")], ["Suprimentos › Aço", () => abrirTela("supaco")], ["Concreto", () => abrirTela("conc")],
    ["Qualidade", () => abrirModulo("qual")], ["Segurança", () => abrirModulo("seg")]];
  for (const [tela, abrir] of telas) { const nome = `${tela} (${tema === "dark" ? "escuro" : "claro"})`;
    await p.evaluate(abrir); await p.waitForTimeout(400);
    if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document.querySelector(".tela:not([hidden])") || document,
      { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] })).violations.map(x => ({ id: x.id, imp: x.impact, ajuda: x.help, n: x.nodes.length, ex: x.nodes[0]?.target.join(" ") })));
    for (const x of v) { total += x.n; const r = porRegra.get(x.id) || { ...x, n: 0, telas: [] }; r.n += x.n; r.telas.push(nome); porRegra.set(x.id, r); }
    console.log(`${v.length ? "aviso" : "ok   "} ${nome}: ${v.length ? v.map(x => `${x.id} (${x.n})`).join(", ") : "nada apontado"}`);
  }
  await ctx.close(); }
  console.log(`\n${total} ponto(s) em ${porRegra.size} regra(s):`);
  const ord = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  for (const r of [...porRegra.values()].sort((a, b) => ord[a.imp] - ord[b.imp])) {
    const linha = `[${r.imp}] ${r.id}: ${r.ajuda} · ${r.n}× em ${[...new Set(r.telas)].join(", ")} · ex.: ${r.ex}`;
    console.log((GH ? "::warning title=Acessibilidade::" : "- ") + linha);
  }
  await nav.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
