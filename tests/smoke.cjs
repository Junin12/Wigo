// Teste rápido antes de publicar: abre o app e o painel num navegador e confere o que mais quebra quando algo dá errado.
// Uso: node tests/smoke.cjs   (precisa do pacote "playwright" e do Chromium; o GitHub Actions instala os dois)
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const TIPOS = { ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".webmanifest":"application/manifest+json" };

const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" }); r.end(b); });
});

const falhas = [];
const confere = (ok, msg) => { console.log(`${ok ? "ok  " : "FALHA"} ${msg}`); if (!ok) falhas.push(msg); };

(async () => {
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ serviceWorkers: "block" });
  // o banco (Google) não é acessado no teste
  await ctx.route(/script\.google(usercontent)?\.com/, r => r.abort());
  // sem internet (teste local): WIGO_LIBS aponta para um node_modules com jspdf, jspdf-autotable, pdfjs-dist e xlsx
  if (process.env.WIGO_LIBS) {
    const L = process.env.WIGO_LIBS, loc = { "jspdf.umd.min.js": "jspdf/dist/jspdf.umd.min.js", "jspdf.plugin.autotable.min.js": "jspdf-autotable/dist/jspdf.plugin.autotable.min.js",
      "pdf.min.js": "pdfjs-dist/build/pdf.min.js", "pdf.worker.min.js": "pdfjs-dist/build/pdf.worker.min.js", "xlsx.full.min.js": "xlsx/dist/xlsx.full.min.js" };
    await ctx.route(/cdnjs\.cloudflare\.com/, r => { const k = Object.keys(loc).find(k => r.request().url().endsWith("/" + k));
      return k ? r.fulfill({ body: fs.readFileSync(path.join(L, loc[k])), contentType: "text/javascript" }) : r.abort(); });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  }

  // ---- app ----
  const p = await ctx.newPage(), erros = [];
  p.on("pageerror", e => erros.push(e.message));
  await p.goto(base + "index.html"); await p.waitForTimeout(1500);
  confere(!erros.length, "app abre sem erro de JavaScript" + (erros.length ? `: ${erros[0]}` : ""));
  confere(await p.evaluate(() => typeof relatorioConc === "function" && typeof docMapa === "function" && typeof importarLab === "function"
    && typeof loteConc === "function" && typeof graficoResist === "function" && typeof chuvaNaData === "function"), "funções principais carregadas");
  confere(await p.evaluate(() => MODULOS.some(m => m.id === "ferr" && m.todos) && typeof abrirFerramentas === "function" && !!document.querySelector("#ferr[hidden]")),
    "botão Ferramentas disponível para todos os cargos");
  confere(await p.evaluate(() => MODULOS.some(m => m.id === "arquivo" && m.todos) && !!MOD2.arquivo && typeof importarArquivo === "function" && window.wigoArquivo === importarArquivo),
    "Arquivo da obra disponível e recebendo a fila da Calculadora de obra");

  // mapa das paredes dos floculadores A e C (gera o PDF inteiro, sem baixar)
  for (const k of ["FLOC-A", "FLOC-C"]) {
    const r = await p.evaluate(async k => {
      try {
        const cat = catParedes(k);
        const c = { id: "teste" + k, data: "2026-10-17", estrutura: "FLOCULADORES", local: cat.nome, status: "Em andamento", cams: [{ n: 1, nf: "1", vol: 8, cor: "#FDD835" }],
          pdfId: mapaCurto({ k, nome: cat.nome, p: cat.par, de: 0.4, ate: 2.35 }), pdfNome: "Mapa das paredes · " + cat.nome };
        const m = mapaDe(c), doc = await docMapa(c, { pintura: true });
        return { folhas: folhasMapa(m).length, paginas: doc.getNumberOfPages() };
      } catch (e) { return { erro: e.message }; }
    }, k);
    confere(!r.erro && r.paginas === r.folhas + 1, `mapa ${k}: ${r.erro || r.paginas + " páginas"}`);
  }
  // Qualidade: dashboards de cada categoria (concreto, aço, solo, forma e geral)
  const dash = await p.evaluate(() => {
    try {
      S.cc = [{ id: "dq", data: "2026-09-28", estrutura: "FLOCULADORES", local: "Fundo e arranque", status: "Concluída", cams: [{ n: 1, nf: "8627", vol: 8, fck: 40, cor: "#E57373" }], pdfId: "", pdfNome: "" }];
      MEMO_EF.clear();
      return MOD2.qual.cats.map(c => `${c.id}:${tipoDash.painel(c.id).filter(Boolean).length}`).join(" ");
    } catch (e) { return "erro: " + e.message; }
  });
  confere(!/erro|:0/.test(dash), `dashboards da Qualidade: ${dash}`);
  // relatório de concretagem e prévia na tela
  const rel = await p.evaluate(async () => {
    try {
      S.cc = [{ id: "rel", data: "2026-09-28", estrutura: "FLOCULADORES", local: "Fundo e arranque", status: "Concluída", cams: [{ n: 1, nf: "8627", vol: 8, fck: 40, cor: "#E57373" }], pdfId: "", pdfNome: "" }];
      const b = document.createElement("button"); document.body.append(b);
      await relatorioConc(concDe("rel"), b, true);
      return document.querySelectorAll(".ver-pdf canvas").length;
    } catch (e) { return e.message; }
  });
  confere(rel >= 1, `prévia do relatório de concretagem: ${rel}`);
  confere(!erros.length, "nenhum erro durante os testes" + (erros.length ? `: ${erros[0]}` : ""));

  // ---- painel ----
  const q = await ctx.newPage(), errosP = [];
  q.on("pageerror", e => errosP.push(e.message));
  await q.goto(base + "painel.html"); await q.waitForTimeout(800);
  confere(await q.evaluate(() => typeof renderCp === "function"), "painel com o gráfico dos corpos de prova");
  confere(!errosP.length, "painel abre sem erro de JavaScript" + (errosP.length ? `: ${errosP[0]}` : ""));

  await nav.close(); srv.close();
  if (falhas.length) { console.log(`\n${falhas.length} falha(s): a publicação foi cancelada.`); process.exit(1); }
  console.log("\nTudo certo.");
})().catch(e => { console.error(e); process.exit(1); });
