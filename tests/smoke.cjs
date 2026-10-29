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
  // Enviados: do computador para o celular, em pedaços (múltiplos de 256 KB) para a pasta Arquivos do Drive
  confere(await p.evaluate(async () => {
    const po = post, ped = [], sv = S.scriptVer; S.scriptVer = 41;
    post = async b => { ped.push(b); if (b.op === "ini") return { up: "u1", parte: 262144 }; const n = b64Bytes(b.b64).length;
      return b.ini + n >= 600000 ? { fim: true, arquivo: { id: "drv1", nome: "planta.dwg", tamanho: 600000, atualizado: "2026-10-29T10:00:00.000Z" } } : { recebido: b.ini + n }; };
    try { await enviarArquivoObra(new File([new Uint8Array(600000).fill(7)], "planta.dwg")); } finally { post = po; S.scriptVer = sv; }
    const r = regs2De("arquivo", "env").find(x => x.dados.id === "drv1"), box = painelEnviados();
    const ok = ped.length === 4 && ped[0].tipo === "application/acad" && ped[2].ini === 262144 && b64Bytes(ped[3].b64).length === 600000 - 2 * 262144
      && b64Bytes(ped[1].b64)[0] === 7 && !!r && r.dados.de === "computador" && box.length >= 4 && (LS.get("envVistos") || []).includes(r.id);
    if (r) delReg2(r.id);
    return ok;
  }), "Arquivo da obra › Enviados manda o arquivo em pedaços e cria o registro para os celulares");
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
  // RDO em PDF de outro sistema (Consulte GEO): linhas como o pdf.js remonta → campos do RDO (os PDFs reais são testados fora daqui)
  confere(await p.evaluate(() => {
    const R = lerRdoPdf([["Consórcio X"], ["#SIAA-RG-121"], ["RELATÓRIO DIÁRIO DE OBRA (RDO)"], ["Enviado para aprovação"], ["IDENTIFICAÇÃO"],
      ["DATA DO RDO", "LOCALIZAÇÃO"], ["22/10/2026 · Quinta", "Rua A"], ["CONDIÇÕES CLIMÁTICAS"], ["MANHÃ", "TARDE", "NOITE"], ["Nublado", "Chuvoso", "Claro"],
      ["RESUMO · ANOTAÇÕES GERAIS DO DIA"], ["- Fundações da ETA"], ["Observações:"], ["01 - Recebidas as carretas"], ["da adutora DN 900."],
      ["ATIVIDADES EXECUTADAS"], ["[6.15] Floculadores", "1 atividade"], ["6.15 Floculadores", "Em andamento"], ["Armação das paredes"], ["Página 2 de 6"],
      ["MÃO DE OBRA"], ["Empresa", "Tipo", "Função", "Qtd"], ["Consórcio", "Própria", "Pedreiro", "7"], ["Consórcio"], ["Terceirizada"], ["Armador"], ["13"], ["TOTAL", "20"],
      ["EQUIPAMENTOS"], ["Tipo", "Identificação", "Operador", "Propriedade", "Status", "Observação"], ["Veículo Leve", "SHU6D29", "Ana", "Locada", "Em uso", "—"],
      ["REGISTROS FOTOGRÁFICOS"], ["#1", "#2"], ["Armação", "Formas"], ["23/10/2026 08:46RASCUNHO", "23/10/2026 08:47"]]);
    return R.numero === "SIAA-RG-121" && R.status === "Enviado para aprovação" && R.data === "2026-10-22"
      && R.clima.manha === "Nublado" && R.clima.tarde === "Chuva" && R.clima.noite === "Bom" && R.observacoes[0] === "Recebidas as carretas da adutora DN 900."
      && R.atividades.length === 1 && R.atividades[0].codigo === "6.15" && R.atividades[0].descricao === "Armação das paredes"
      && R.maoObra.length === 2 && R.maoObra[1].qtd === 13 && R.totalMo === 20 && R.equipamentos[0].ident === "SHU6D29"
      && R.fotos.length === 2 && R.fotos[0].em === "23/10/2026 08:46" && typeof importarRdoPdf === "function";
  }), "leitor de RDO em PDF: número, data, clima, observações, atividades, mão de obra, equipamentos e fotos");

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
  // laje + arranque (decantador): só as paredes escolhidas, pintura até 0,45 m e limite da forma na folha 1
  confere(await p.evaluate(() => {
    const cat = catParedes("DEC"), c = { id: "fa", cams: [], pdfId: mapaCurto({ forma: { id: "x", nome: "", pag: 1, lim: { 1: [[0, 0, 100, 0, 100, 100, 0, 100]] } },
      k: "DEC", nome: cat.nome, p: cat.par.slice(0, 2), ate: 0.45 }) };
    const a1 = areaPintavel(c, 1), a2 = areaPintavel(c, 2), w = folhasMapa(mapaDe(c))[0].ws[0];
    return mapaDe(c).p.length === 2 && a1?.[0]?.pol?.length === 4 && a2.length === 1 && Math.abs(a2[0][3] - 0.45 * w.s) < 0.01
      && naArea(a1, ...ptMm(50, 50), 0) && !naArea(a1, ...ptMm(200, 200), 0);
  }), "laje + arranque: paredes escolhidas até 0,45 m e limite da forma");
  // altura confirmada por parede (alt) e texto do caminhão arrastado (cams[].rot): vale no mapa e no relatório
  const alt = await p.evaluate(async () => {
    try {
      const cat = catParedes("DEC"), ps = cat.par.slice(0, 2), c = { id: "fa2", data: "2026-10-28", cams: [{ n: 1, vol: 8, cor: "#FDD835", rot: { p2: [100, 300] } }],
        pdfId: mapaCurto({ forma: { id: "x", nome: "", pag: 1 }, k: "DEC", nome: cat.nome, p: ps, ate: 0.45, alt: { [ps[1].id]: 0.8 } }) };
      S.pendTr.t_alt = { conc: "fa2", cam: 1, pag: 2, w: 4, pts: [200, 100, 220, 100] };
      const m = mapaDe(c), fs = folhasMapa(m), a = [2, 3].map(n => areaPintavel(c, n)[0]), s = [0, 1].map(i => fs[i].ws[0].s);
      const doc = await docMapa(c, { pintura: false }); delete S.pendTr.t_alt;
      return m.alt[ps[1].id] === 0.8 && Math.abs(a[0][3] - 0.45 * s[0]) < 0.01 && Math.abs(a[1][3] - 0.8 * s[1]) < 0.01
        && rotDe(c, 1, "p2")[0] === 100 && doc.getNumberOfPages() === fs.length + 2;
    } catch (e) { return false; }
  });
  confere(alt, "arranque: altura de cada parede e texto do caminhão no lugar escolhido");
  // aço por etapa (parede sem cadastro de arranque, pela regra do comprimento): fundo e todas as verticais na 1ª; horizontais
  // pela altura da parede (Floculador, H = 4,55 m: 0,45 m na 1ª, 1,90 no lance 1, 1,95 no lance 2); armado enche de baixo para cima
  confere(await p.evaluate(() => {
    const mk = (c, loc, qp, cu, kp) => ({ c, est: "FLOCULADORES", loc, qp, cu, kp, ppb: kp / qp });
    const its = [mk("F", "FUNDO", 10, 11, 100), mk("V", "PAREDE 4, PAREDE 5 E PAREDE 6", 10, 4.89, 100), mk("A", "PAREDE 4, PAREDE 5 E PAREDE 6", 10, 2.95, 100),
      mk("H", "PAREDE 4, PAREDE 5 E PAREDE 6", 455, 9.7, 455), mk("L", "LAJE DAS PASSARELAS", 10, 10, 50), mk("X", "PILARES", 10, 3, 30)];
    const antes = S.pendCfg.ACO_MODULOS; S.pendCfg.ACO_MODULOS = JSON.stringify({ FLOCULADORES: { n: 1 } }); // sem módulos neste caso
    const r = aeSoma(its, new Map([["F", 10], ["V", 10], ["A", 10], ["H", 100]])), ok = (a, b) => Math.abs(a - b) < 0.01;
    if (antes == null) delete S.pendCfg.ACO_MODULOS; else S.pendCfg.ACO_MODULOS = antes;
    return ok(r.p[0], 345) && ok(r.p[1], 190) && ok(r.p[2], 195) && ok(r.p[3], 75) && ok(r.x[0], 345) && ok(r.x[1], 55) && r.x[2] === 0 && r.op === 30;
  }), "aço por etapa de concretagem: fundo + todas as verticais + horizontais até 0,45 m na 1ª etapa");
  // módulos (juntas de dilatação): floculadores 1 e 3 em armação → nenhuma etapa passa de 2/3, mesmo com mais barras lançadas
  confere(await p.evaluate(() => {
    const it = { c: "M", est: "FLOCULADORES", loc: "PAREDE 4, PAREDE 5 E PAREDE 6", qp: 300, cu: 9.7, kp: 300, ppb: 1 };
    const antes = S.pendCfg.ACO_MODULOS; delete S.pendCfg.ACO_MODULOS; // padrão: módulos 1 e 3
    const r = aeSoma([it], new Map([["M", 180]])), m2 = aeSoma([it], new Map([["M", 180]]), 2), r2 = aeSoma([it], new Map([["M", 250]]));
    if (antes != null) S.pendCfg.ACO_MODULOS = antes;
    const ok = (a, b) => Math.abs(a - b) < 0.01;
    return ok(r.x[0] / r.p[0], 2 / 3) && ok(r.x[1] / r.p[1], 2 / 3) && m2.x.every(v => v === 0) && ok(r2.x[0] + r2.x[1] + r2.x[2] + r2.x[3], 250) && r2.x[1] / r2.p[1] > 2 / 3;
  }), "módulos 1 e 3 de 3 em armação: cada etapa no máximo 66,7%; o que passar vai para o módulo 2");
  // parede com o arranque cadastrado (pedido de aço): vertical na 1ª, costela pela altura, posição fora do cadastro só da 2ª em diante
  confere(await p.evaluate(() => {
    const mk = (pos, cu) => ({ c: pos, pos, est: "FLOCULADORES", loc: "PAREDE 1 , PAREDE 2, PAREDE 3", qp: 455, cu, kp: 455, ppb: 1 });
    const f = ["N7", "N6", "N2"].map(n => aeFracoes(mk(n, n === "N7" ? 4.89 : 10)).map(v => Math.round(v * 1000) / 1000));
    return f[0].join() === "1,0,0,0" && f[1].join() === "0.099,0.418,0.429,0.055" && f[2][0] === 0 && Math.abs(f[2].reduce((a, v) => a + v, 0) - 1) < 1e-9;
  }), "arranque cadastrado: vertical na 1ª, costela pela altura e posição fora do arranque a partir do lance 1");
  // projetos separados por disciplina, pela codificação da prancha (ou pelas palavras do nome)
  confere(await p.evaluate(() => [["PR-023-006-E8-PE-EST-DE-038-01 FLOCULADORES.pdf", "Estrutural"], ["PR-023-006-E8-PE-HID-DE-056-01 CANTEIRO.pdf", "Hidráulica"],
    ["PR-023-006-E8-PE-ARQ-DE-010-00 ADM.pdf", "Arquitetônico"], ["PR-023-006-E8-PE-TER-DE-001-00 TERRAPLENAGEM.pdf", "Civil"], ["ATA REUNIÃO.pdf", "Outros"]]
    .every(([n, s]) => secaoProjeto(n) === s) && pjTitulo("PR-023-006-E8-PE-EST-MD-002-00 MEMORIAL.pdf") === "MEMORIAL"
    && localProjeto("PR-023-006-E7-PE-EST-DE-001-03 AR - TQ. PULMÃO.pdf") === "Alto Recalque" && localProjeto("PR-023-006-E5-PE-EST-DE-001-02 CPT - CANAL.pdf") === "Captação / Baixo Recalque"
    && pjTipoDoc("PR-023-006-E8-PE-EST-DE-038-01 ETA - FLOCULADORES - ARMADURAS - 5 FL.pdf") === "desenho · armaduras"), "projetos por seção e por local (ETA, Alto Recalque, Captação), com formas/armaduras");
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
  // chuva prevista na concretagem programada: aparece nas Pendências do início e na checagem da obra
  const chuva = await p.evaluate(() => {
    try {
      const am = somaDias(hojeISO(), 1), U0 = U;
      PREV.dados = { em: Date.now(), dias: { [am]: { p: 80, mm: 12 } } };
      S.cc = [{ id: "chuva", data: am, estrutura: "FLOCULADORES", local: "Paredes lance 2", status: "Programada", cams: [], volPrev: 20, pdfId: "", pdfNome: "" }];
      U = { nome: "Teste", cargo: "Engenheiro de produção" }; MEMO_EF.clear();
      const ini = pendInicio()?.textContent || "", ch = checagemObra().find(x => /chuva/.test(x.tit));
      U = U0;
      return concComChuva().length === 1 && /🌧.*80%.*12,0 mm/.test(ini) && ch?.cor === "and" ? "ok" : `início: "${ini.slice(0, 120)}" · checagem: ${ch?.cor}`;
    } catch (e) { return "erro: " + e.message; }
  });
  confere(chuva === "ok", `alerta de chuva na concretagem programada: ${chuva}`);
  // Suprimentos › Aço: romaneios e total por bitola só da estrutura escolhida (sem escolha, nada listado)
  const supAco = await p.evaluate(() => {
    try {
      const box = document.querySelector("#sup-aco"), tit = () => [...box.querySelectorAll("h3")].map(h => h.textContent);
      const kgBit = L => L.reduce((s, R) => s + Object.values(R.b).reduce((a, b) => a + b, 0), 0) / 1000;
      const totBit = () => [...[...box.querySelectorAll("tbody")].at(-1).rows].reduce((s, tr) => s + numBR(tr.lastChild.textContent), 0);
      SUPACO.est = ""; renderSupAco(); const nada = !tit().some(h => /bitola/.test(h)) && !!box.querySelector(".vazio");
      const est = remessas()[0].est; SUPACO.est = est; renderSupAco();
      const so = tit().filter(h => !/bitola/.test(h)).every(h => h === est) && tit().some(h => h.includes("bitola") && h.includes(est));
      const okKg = Math.abs(totBit() - kgBit(remessas().filter(R => R.est === est))) < 0.2;
      SUPACO.est = "*"; renderSupAco(); const todas = Math.abs(totBit() - kgBit(remessas())) < 0.5;
      SUPACO.est = "";
      return nada && so && okKg && todas ? "ok" : `nada:${nada} só ${est}:${so} kg:${okKg} todas:${todas}`;
    } catch (e) { return "erro: " + e.message; }
  });
  confere(supAco === "ok", `Suprimentos › Aço filtrado por estrutura: ${supAco}`);
  // v149: busca geral (sem acento e com erro de digitação), dica nos gráficos, ordem dos atalhos, tour e tempos
  const v149 = await p.evaluate(() => {
    try {
      const U0 = U; U = { nome: "Teste", cargo: "Gerente de obra" }; MEMO_EF.clear();
      const r = [];
      if (!(notaBusca("floculadr", "Floculadores A") > 0 && notaBusca("decantador", "Decantadores") > 0 && notaBusca("acai", "Romaneio 004336") === 0)) r.push("nota");
      const fs = fontesBusca(); if (!fs.some(f => f.tit === "Romaneio 004336") || !fs.some(f => f.grupo === "Telas")) r.push("fontes");
      const svg = svgChart([{ label: "S1", v: 2 }, { label: "S2", v: 3 }]); if (svg.querySelectorAll(".alvo[data-tip]").length !== 2) r.push("dica");
      const cv = svgCurva([{ pts: [[0, 1], [1, 2]], cls: "ln", nome: "Realizado" }], ["S1", "S2"], 3, { un: " t" });
      if (!/S2\nRealizado: 2,0 t/.test(cv.querySelectorAll(".alvo")[1]?.dataset.tip || "")) r.push("curva");
      const box = el("div", { id: "teste-ordem" }, ...["a", "b", "c"].map(id => el("button", { class: "mod", "data-id": id })));
      LS.set("ordem:teste-ordem", ["c", "a"]); aplicarOrdem(box); if ([...box.children].map(b => b.dataset.id).join("") !== "cab") r.push("ordem");
      localStorage.removeItem("arm:ordem:teste-ordem");
      if (typeof iniciarTour !== "function" || typeof verFoto !== "function" || typeof receberCompartilhado !== "function") r.push("funções");
      if (mediana([3, 1, 2]) !== 2 || !("abre" in temposDoCelular())) r.push("tempos");
      U = U0; return r.length ? r.join(", ") : "ok";
    } catch (e) { return "erro: " + e.message; }
  });
  confere(v149 === "ok", `busca geral, dica nos gráficos, ordem dos atalhos e tempos: ${v149}`);
  // v164: romaneio pelo PDF (texto), romaneios da planilha, concreto → Suprimentos, equipamentos, faltas repetidas, SINAPI e LGPD
  const v164 = await p.evaluate(() => {
    const r = [], S0 = JSON.stringify({ cc: S.cc, pendReg2: S.pendReg2, pendCfg: S.pendCfg, reg2: S.reg2, pes: S.pes, presEf: S.presEf }), U0 = U;
    try {
      U = { nome: "Teste", cargo: "Engenheiro de produção" }; MEMO_EF.clear();
      const t = "Descrição: RESERVATÓRIO (ROM.1)\nRomaneio\nC.AGUA.004901\nElemento: PAR1 Qtd: 1\nBitola Aço\n12,5mm CA50\nComp.(cm):\n275\nPeso (Kg):\n328,38\nElemento: LAJE Qtd: 2\n8mm CA50\nPeso (Kg):\n1.022,04\nImpresso em: 05/10/2026 às 10:05";
      const x = lerRomaneioTexto(t);
      if (!(x.n === "004901" && x.emit === "2026-10-05" && x.b["12.5"] === 328.38 && x.b["8"] === 1022.04 && x.pos === 2 && /PAR1 · LAJE/.test(x.els))) r.push("leitura do romaneio " + JSON.stringify(x));
      setCfg("ACO_REMESSA_90", JSON.stringify({ est: "RESERVATÓRIO" })); setCfg("ACO_ROMANEIO_004901", JSON.stringify({ n: "004901", rem: 90, desc: "teste", emit: "2026-10-05", b: x.b }));
      const R = remessas().find(q => q.n === 90);
      if (!(R && R.est === "RESERVATÓRIO" && Math.abs(R.kg - 1350.42) < 0.01 && ROMANEIOS.some(q => q.n === "004901"))) r.push("romaneio da planilha");
      setCfg("ACO_ROMANEIO_004901", ""); setCfg("ACO_REMESSA_90", ""); remessas();
      if (ROMANEIOS.some(q => q.n === "004901") || REMESSAS_ACO[90]) r.push("romaneio apagado continuou");
      S.cc = [{ id: "cct", data: "2026-10-20", estrutura: "FLOCULADORES", local: "Lance 3", status: "Em andamento", cams: [], volPrev: 20 }];
      setConc("cct", { cams: [{ n: 1, nf: "123", vol: 8, usina: "Supermix" }, { n: 2, nf: "124", vol: 7 }] });
      let rc = regs2De("sup", "conc").filter(q => q.id.startsWith("rcc-cct-"));
      if (!(rc.length === 2 && rc.find(q => q.id === "rcc-cct-1").dados.forn === "Supermix" && rc.find(q => q.id === "rcc-cct-2").dados.qtd === 7)) r.push("concreto em Suprimentos");
      setConc("cct", { cams: [{ n: 1, nf: "123", vol: 8, usina: "Supermix" }] });
      rc = regs2De("sup", "conc").filter(q => q.id.startsWith("rcc-cct-")); if (rc.length !== 1) r.push("caminhão excluído continuou em Suprimentos");
      const sit = situacaoEquip({ dados: { nome: "Escavadeira T", rev: 250, hRev: 0, posse: "Locado", valor: 100, valorUn: "hora" } });
      setReg2("eqt1", { modulo: "equip", tipo: "apont", data: hojeISO(), status: "Trabalhando", dados: { equip: "Escavadeira T", hi: 230, hf: 240, horas: 10 } });
      const s2 = situacaoEquip({ dados: { nome: "Escavadeira T", rev: 250, hRev: 0, posse: "Locado", valor: 100, valorUn: "hora" } });
      if (!(sit.h === null && s2.h === 240 && s2.rev.falta === 10 && s2.rev.cor === "and" && s2.custo === 1000)) r.push("equipamento " + JSON.stringify(s2));
      S.pes = [{ id: "pf1", nome: "Fulano Teste", fid: "" }]; const ym = hojeISO().slice(0, 7);
      S.presEf = { [ym + "-01"]: { pf1: "F" }, [ym + "-02"]: { pf1: "F" }, [ym + "-03"]: { pf1: "AT" } }; MEMO_EF.clear();
      const f2 = faltasRepetidas(2); if (!(f2.length === 1 && f2[0].n === 2) || faltasRepetidas(3).length) r.push("faltas repetidas");
      if (precoSinapi({ pu: { MG: 10, SP: 12 } }, "SP") !== 12 || precoSinapi({ p: 5 }, "MG") !== 5 || !buscaSinapi(() => {})) r.push("SINAPI");
      const dp = dadosDaPessoa(S.pes[0]); if (!(dp.pessoa.nome === "Fulano Teste" && dp.presencas.length === 3)) r.push("dados da pessoa (LGPD)");
      if (textoTermo().length < 5 || typeof pedirPin !== "function" || typeof faixaTeste !== "function") r.push("termo/PIN/faixa");
    } catch (e) { r.push("erro: " + e.message); }
    finally { Object.assign(S, JSON.parse(S0)); U = U0; savePendReg2(); MEMO_EF.clear(); }
    return r.length ? r.join(" · ") : "ok";
  });
  confere(v164 === "ok", `romaneio pelo PDF, romaneios da planilha, concreto em Suprimentos, equipamentos, faltas, SINAPI e LGPD: ${v164}`);
  // v165: cronograma da obra importado do MS Project (XML) e do Excel, dias úteis, previsão por atividade e equipe necessária
  const v165 = await p.evaluate(async () => {
    const r = [], S0 = JSON.stringify({ pendReg2: S.pendReg2, pendReg2Del: S.pendReg2Del, reg2: S.reg2 }), U0 = U;
    try {
      U = { nome: "Teste", cargo: "Engenheiro de produção" }; MEMO_EF.clear();
      // calendário: 2026-11-02 (Finados) e domingo não são úteis; com 6 dias/semana o sábado é
      if (diaUtil("2026-11-02") || diaUtil("2026-11-01") || !diaUtil("2026-10-31") === (DIAS() >= 6)) r.push("dia útil");
      if (pascoa(2026) !== "2026-04-05" || !feriadosAno(2026).has("2026-02-17") || !feriadosAno(2026).has("2026-06-04")) r.push("feriados móveis");
      if (somaUteis("2026-10-29", 3) !== (DIAS() >= 6 ? "2026-10-31" : "2026-11-03")) r.push("soma de dias úteis " + somaUteis("2026-10-29", 3));
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Project xmlns="http://schemas.microsoft.com/project"><Title>Obra teste</Title><Tasks>
        <Task><UID>0</UID><ID>0</ID><Name>Obra teste</Name><OutlineLevel>0</OutlineLevel><Summary>1</Summary></Task>
        <Task><UID>1</UID><ID>1</ID><Name>Fundações</Name><OutlineLevel>1</OutlineLevel><Summary>1</Summary><Start>2026-09-01T08:00:00</Start><Finish>2026-12-30T17:00:00</Finish></Task>
        <Task><UID>2</UID><ID>2</ID><Name>Escavação das sapatas</Name><OutlineLevel>2</OutlineLevel><Summary>0</Summary><Start>2026-09-01T08:00:00</Start><Finish>2026-09-30T17:00:00</Finish><PercentComplete>100</PercentComplete><Cost>1000</Cost><Work>PT80H0M0S</Work></Task>
        <Task><UID>3</UID><ID>3</ID><Name>Concreto das sapatas</Name><OutlineLevel>2</OutlineLevel><Summary>0</Summary><Start>2026-10-01T08:00:00</Start><Finish>2026-12-30T17:00:00</Finish><PercentComplete>10</PercentComplete><Cost>3000</Cost>
          <PredecessorLink><PredecessorUID>2</PredecessorUID></PredecessorLink><Baseline><Number>0</Number><Start>2026-10-01T08:00:00</Start><Finish>2026-12-15T17:00:00</Finish></Baseline></Task>
        <Task><UID>4</UID><ID>4</ID><Name>Entrega</Name><OutlineLevel>1</OutlineLevel><Summary>0</Summary><Milestone>1</Milestone><Start>2026-12-30T17:00:00</Start><Finish>2026-12-30T17:00:00</Finish></Task>
      </Tasks></Project>`;
      const x = lerMsProjectXml(xml), ts = x.tarefas.filter(t => !t.resumo && !t.marco);
      if (!(x.nome === "Obra teste" && ts.length === 2 && ts[1].grupo === "Fundações" && ts[1].pred === "2" && ts[1].fimBase === "2026-12-15" && ts[0].trabalho === 80)) r.push("XML do Project " + JSON.stringify(ts[1]));
      gravarCronoImportado(ts, "MS Project", "custo", true, false);
      let L = regs2De("med", "crono").filter(q => q.dados.origem === "MS Project");
      const c = L.find(q => q.dados.uid === "3");
      if (!(L.length === 2 && c && c.dados.real === 10 && c.dados.un === "%" && c.dados.peso === 3000 && c.dados.fimBase === "2026-12-15")) r.push("gravação da importação " + JSON.stringify(c?.dados));
      // reimportar o mesmo arquivo com % novo: atualiza, não duplica
      ts[1].pct = 40; gravarCronoImportado(ts, "MS Project", "custo", true, false);
      L = regs2De("med", "crono").filter(q => q.dados.origem === "MS Project");
      if (!(L.length === 2 && L.find(q => q.dados.uid === "3").dados.real === 40)) r.push("reimportação");
      // planilha (exportada do Project ou feita à mão)
      await loadXLSX();
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Cronograma da obra"], ["Id", "Nome da tarefa", "Início", "Término", "% concluída", "Quantidade", "Unidade"],
        [1, "Rede de água", "01/10/2026", "30/11/2026", "", "", ""], [2, "  Assentamento adutora AT-01", "01/10/26", "30/11/26", "25%", 1200, "m"], [3, "  Armação das paredes", 46296, 46356, 0.5, 15000, "kg"]]), "Plan1");
      const y = lerCronoPlanilha(wb), ty = y.tarefas.filter(t => !t.resumo);
      if (!(ty.length === 2 && ty[0].grupo === "Rede de água" && ty[0].ini === "2026-10-01" && ty[0].pct === 25 && ty[1].ini === "2026-10-01" && ty[1].pct === 50)) r.push("planilha " + JSON.stringify(ty));
      const fa = fonteAuto(ty[0]), fb = fonteAuto(ty[1]);
      if (!(fa?.fonte === "Rede assentada (m)" && fb?.fonte === "Aço armado (t)" && fb.prev === 15)) r.push("ligação ao realizado do Wigo");
      // previsão no ritmo real e equipe necessária
      const h = hojeISO(), ini = somaDias(h, -20), fim = somaDias(h, 20), pv = previsaoAtiv({ prev: 100, ini, fim, equipe: 2 }, 20);
      if (!(pv.fimPrev > fim && pv.atrasoDias > 0 && pv.faltamPessoas > 0)) r.push("previsão " + JSON.stringify(pv));
      // fim calculado pela produtividade (100 m² ÷ (5 m²/pessoa/dia × 2 pessoas) = 10 dias úteis)
      const T = MOD2.med.tipos.find(t => t.id === "crono"), d = { prev: 100, equipe: 2, prod: 5, ini: "2026-10-01" }; T.calc(d);
      if (d.fim !== somaUteis("2026-10-01", 10)) r.push("fim pela produtividade " + d.fim);
      const R = resumoCrono(regs2De("med", "crono")); if (!(R && R.fimPrev !== undefined && ganttCrono(R).querySelector("svg"))) r.push("resumo/Gantt");
      if (topoCrono(regs2De("med", "crono")).length < 4) r.push("tela do cronograma");
    } catch (e) { r.push("erro: " + e.message); }
    finally { Object.assign(S, JSON.parse(S0)); U = U0; savePendReg2(); MEMO_EF.clear(); }
    return r.length ? r.join(" · ") : "ok";
  });
  confere(v165 === "ok", `cronograma do MS Project/Excel, dias úteis, previsão e equipe necessária: ${v165}`);
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, "manifest.webmanifest"), "utf8"));
  confere(man.share_target?.method === "POST" && /compartilhar/.test(man.share_target.action) && /compartilhar/.test(fs.readFileSync(path.join(RAIZ, "sw.js"), "utf8")),
    "compartilhar para o WIGO: manifest e sw.js");
  // fila offline: com o localStorage cheio a fila vai só para o IndexedDB, e volta quando o app abre de novo
  const semLS = await p.evaluate(async () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === "arm:pendRdo") throw new DOMException("cheio", "QuotaExceededError"); return orig.call(this, k, v); };
    try { S.pendRdo = { "2026-01-05": { teste: "fila-idb" } }; savePendRdo(); } finally { Storage.prototype.setItem = orig; }
    await new Promise(r => setTimeout(r, 300));
    return filaIDB.ok && localStorage.getItem("arm:pendRdo") === null;
  });
  await p.reload(); await p.waitForTimeout(1500);
  confere(semLS && await p.evaluate(() => S.pendRdo["2026-01-05"]?.teste === "fila-idb" && pendCount() >= 1),
    "fila offline guardada no IndexedDB com o localStorage cheio e lida de volta ao abrir o app");
  await p.evaluate(() => { S.pendRdo = { "2026-01-06": { teste: "ls" } }; savePendRdo(); });
  await p.reload(); await p.waitForTimeout(1500);
  confere(await p.evaluate(() => S.pendRdo["2026-01-06"]?.teste === "ls" && !S.pendRdo["2026-01-05"]), "fila com espaço no localStorage: vale a cópia mais nova");
  await p.evaluate(() => { S.pendRdo = {}; savePendRdo(); });
  const paresReg2 = [...new Set([...fs.readFileSync(path.join(RAIZ, "index.html"), "utf8").matchAll(/modulo:"([a-z0-9_]+)", *tipo:"([a-z0-9_]+)"/g)].map(m => `${m[1]}/${m[2]}`))];
  const semCadastro = await p.evaluate(ps => ps.filter(k => { const [m, t] = k.split("/"); return !MOD2[m]?.tipos.some(x => x.id === t) && !REG2_INTERNOS.has(k); }), paresReg2);
  confere(!semCadastro.length, "todo registro gravado pelo app tem módulo ou é interno (Diagnóstico sem falso alerta)" + (semCadastro.length ? `: ${semCadastro.join(", ")}` : ""));
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
