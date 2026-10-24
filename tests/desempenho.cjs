// Desempenho no celular: quanto o app demora para abrir e para trocar de tela num celular simples (CPU 6× mais lenta, 4G lento).
// Adaptado do /benchmark do gstack (MIT, Garry Tan). Compara com tests/desempenho-base.json e avisa o que piorou mais de 20%.
// Uso: node tests/desempenho.cjs            (mede e compara)
//      node tests/desempenho.cjs --base     (mede e grava a nova referência)
//      node tests/desempenho.cjs --rodadas 5 --rigido   (mais rodadas; sai com erro se algo estourar o orçamento ou piorar)
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, ".."), BASE = path.join(__dirname, "desempenho-base.json");
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const RODADAS = +arg("--rodadas") || 3, GRAVAR = process.argv.includes("--base"), RIGIDO = process.argv.includes("--rigido");
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" }); r.end(b); });
});
// orçamento (celular simples, 4G lento): acima disso é FALHA; de 90% a 100% é ATENÇÃO
const ORC = { prontoG: 3000, pronto: 8000, fcp: 2500, telaMax: 600, transf: 3e6, html: 1.3e6 };
const TELAS = ["prod", "conc", "fotos", "rdo", "ponto", "producao", "supaco"];
const mediana = a => { const s = a.filter(v => v != null).sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };

async function rodada(nav, base) {
  const ctx = await nav.newContext({ ...devices["Pixel 7"] });
  await ctx.route(/script\.google(usercontent)?\.com/, r => r.abort());
  await ctx.addInitScript(() => { const u = { nome: "Teste", cargo: "Gerente de obra" };
    localStorage.setItem("arm:usuario", JSON.stringify(u)); localStorage.setItem("arm:acesso", JSON.stringify({ status: "liberado", ...u }));
    localStorage.setItem("arm:tour:Gerente de obra", "1");
    window.__lt = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt += e.duration - 50; }).observe({ type: "longtask", buffered: true }); } catch {} });
  const p = await ctx.newPage(), cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  const medir = () => p.evaluate(() => {
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
    const rs = performance.getEntriesByType("resource"), nav = performance.getEntriesByType("navigation")[0];
    return { pronto: TEMPOS.abre, fcp, longas: Math.round(window.__lt), transf: rs.reduce((s, e) => s + (e.transferSize || 0), 0) + (nav?.transferSize || 0),
      lentos: rs.map(r => ({ n: r.name.split("/").pop().split("?")[0], ms: Math.round(r.duration) })).sort((a, b) => b.ms - a.ms).slice(0, 5) };
  });
  // 1ª vez: baixa tudo; depois, com o app guardado pelo sw.js (é como os celulares da obra abrem no dia a dia)
  await p.goto(base + "index.html");
  await p.waitForFunction(() => window.__wigoOk === true, null, { timeout: 60000 });
  await p.waitForTimeout(500);
  const m = await medir();
  await p.evaluate(() => navigator.serviceWorker.ready); await p.waitForTimeout(3000);
  await p.reload(); await p.waitForFunction(() => window.__wigoOk === true, null, { timeout: 60000 }); await p.waitForTimeout(500);
  const g = await medir(); m.prontoG = g.pronto; m.fcpG = g.fcp;
  m.telas = {};
  for (const t of TELAS) {
    m.telas[t] = await p.evaluate(t => { const t0 = performance.now(); abrirTela(t); return new Promise(r => requestAnimationFrame(() => r(Math.round(performance.now() - t0)))); }, t);
    await p.evaluate(() => abrirTela("inicio"));
  }
  await ctx.close();
  return m;
}

(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${srv.address().port}/`, nav = await chromium.launch();
  const R = []; for (let i = 0; i < RODADAS; i++) { R.push(await rodada(nav, base)); process.stdout.write(`rodada ${i + 1}/${RODADAS} ok\n`); }
  await nav.close(); srv.close();
  const html = fs.statSync(path.join(RAIZ, "index.html")).size;
  const atual = { em: new Date().toISOString().slice(0, 10), versao: (fs.readFileSync(path.join(RAIZ, "index.html"), "utf8").match(/VERSAO_APP = "(v\d+)"/) || [])[1],
    pronto: mediana(R.map(r => r.pronto)), prontoG: mediana(R.map(r => r.prontoG)), fcpG: Math.round(mediana(R.map(r => r.fcpG))), fcp: Math.round(mediana(R.map(r => r.fcp))), longas: mediana(R.map(r => r.longas)), transf: mediana(R.map(r => r.transf)), html,
    telas: Object.fromEntries(TELAS.map(t => [t, mediana(R.map(r => r.telas[t]))])) };
  const ant = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, "utf8")) : null;
  const seg = v => (v / 1000).toFixed(2).replace(".", ",") + " s", kb = v => Math.round(v / 1024) + " KB";
  const dif = (a, b) => a != null && b ? Math.round((a - b) / b * 100) : null;
  let falhas = 0;
  const linha = (nome, v, fmt, orc, b) => { const d = dif(v, b), st = orc == null ? "" : v >= orc ? "FALHA" : v >= orc * 0.9 ? "ATENÇÃO" : "ok";
    const pior = d != null && d > 20; if (st === "FALHA" || pior) falhas++;
    console.log(`${nome.padEnd(30)} ${fmt(v).padStart(10)}   ${orc != null ? ("orçamento " + fmt(orc)).padEnd(20) : "".padEnd(20)} ${st.padEnd(8)} ${d != null ? (d > 0 ? "+" : "") + d + "% vs referência" + (pior ? " ⚠ piorou" : "") : ""}`); };
  console.log(`\nDESEMPENHO ${atual.versao} · celular simples (CPU 6×) · 4G lento · mediana de ${RODADAS} rodadas\n`);
  linha("App pronto (dia a dia)", atual.prontoG, seg, ORC.prontoG, ant?.prontoG);
  linha("Primeira pintura (dia a dia)", atual.fcpG, seg, ORC.fcp, ant?.fcpG);
  linha("App pronto (1ª vez, baixando)", atual.pronto, seg, ORC.pronto, ant?.pronto);
  linha("Primeira pintura (1ª vez)", atual.fcp, seg, ORC.fcp, ant?.fcp);
  linha("Travadas do JS (>50 ms)", atual.longas, seg, null, ant?.longas);
  linha("Baixado ao abrir", atual.transf, kb, ORC.transf, ant?.transf);
  linha("Tamanho do index.html", html, kb, ORC.html, ant?.html);
  for (const t of TELAS) linha(`Abrir a tela ${t}`, atual.telas[t], v => v + " ms", ORC.telaMax, ant?.telas?.[t]);
  console.log("\nMais lentos ao abrir:", R[0].lentos.map(x => `${x.n} ${x.ms} ms`).join(" · "));
  if (GRAVAR || !ant) { fs.writeFileSync(BASE, JSON.stringify(atual, null, 2) + "\n"); console.log(`\nReferência gravada em tests/desempenho-base.json (${atual.versao}).`); }
  if (RIGIDO && falhas) { console.log(`\n${falhas} item(ns) estouraram o orçamento ou pioraram mais de 20%.`); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
