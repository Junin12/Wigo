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
    await ctx.route(/cdnjs\.cloudflare\.com|cdn\.sheetjs\.com/, r => { const k = Object.keys(loc).find(k => r.request().url().endsWith("/" + k));
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
  // campo e saneamento: abas novas nos módulos que já existiam e as contas de referência
  confere(await p.evaluate(() => {
    const tem = (m, t) => MOD2[m].tipos.some(x => x.id === t);
    const h = hidCalc({ modo: "bomba", Q: 50, D: 300, L: 2000, C: 150, loc: 10, Hg: 40, eta: 65 });
    const v = volSecoes([{ ac: 4, aa: 0 }, { dist: 20, ac: 6, aa: 1 }, { dist: 20, ac: 5, aa: 2 }]);
    return tem("obras", "pto") && tem("obras", "hid") && tem("med", "rede") && tem("qual", "pres") && tem("seg", "vala")
      && Math.abs(h.Jkm - 1.36) < 0.01 && Math.abs(h.kW - 32.45) < 0.05 && v.c === 210 && v.a === 40
      && Math.abs(presPerm({ comp: 300, diam: 300, pTeste: 90, dur: 60 }) - 3.74) < 0.01 && valaCalc({ prof: 2.2, prot: "Nenhuma" }).av.length === 1;
  }), "pontos no mapa, rede assentada, hidráulica, teste de pressão e escavações (NR-18)");
  // segurança, cronograma, almoxarifado, pendência na prancha e checagem
  confere(await p.evaluate(() => {
    const tem = (m, t) => MOD2[m].tipos.some(x => x.id === t);
    const pt = problemasPT({ tipo: "Espaço confinado (NR-33)", exec: [], gases: { o2: 18, lel: 0, h2s: 0, co: 0 } });
    return ["trein", "pt", "epi"].every(t => tem("seg", t)) && tem("med", "crono") && tem("sup", "almox") && MATERIAIS.some(m => m.id === "almox")
      && MOD2.qual.tipos.find(t => t.id === "nc").campos.some(c => c.k === "pr") && !!document.querySelector("#v-pend")
      && pt.length === 1 && /O₂/.test(pt[0]) && addMeses("2026-01-31", 1) === "2026-03-03" && Array.isArray(checagemObra());
  }), "treinamentos, permissão de trabalho, EPI, curva S, almoxarifado, pendência na prancha e checagem");
  // laudos do laboratório: avaliação de compactação, agregado e traço (a leitura do PDF é testada com os laudos reais, fora daqui)
  confere(await p.evaluate(() => {
    const cfg = { gcMin: 95, umTol: 2, caa: "IV" };
    const comp = avaliarLaudo({ tipo: "comp", linhas: [{ data: "2026-08-31", local: "Canaleta", gc: 100.6, hot: 12.2, hcampo: 10 }, { data: "2026-09-01", local: "Canaleta", gc: 94, hot: 12, hcampo: 12 }] }, cfg);
    const traco = avaliarLaudo({ tipo: "traco", v: { fck: 30, sd: 5.5, fcj: 39.1, ac: 0.525, cons: 390 } }, cfg);
    const areia = avaliarLaudo({ tipo: "miudo", v: { mf: 1.97, finos: 1.5, torroes: 0.3 } }, cfg);
    return MOD2.qual.tipos.some(t => t.id === "laudo") && comp.status === "Não conforme" && comp.alertas.some(a => /ramo seco/.test(a[1]))
      && traco.status === "Atenção" && areia.status === "Atenção" && numBR("1.000,5") === 1000.5 && dataLaudo("31/08/26") === "2026-08-31";
  }), "laudos do laboratório: compactação, traço e agregados avaliados");

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
