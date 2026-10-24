// Canário: depois de publicar, confere o app NO AR (wiapps.com.br/wigo) como um celular que abre pela primeira vez.
// Adaptado do /canary do gstack (MIT, Garry Tan): só alerta o que se repete em 2 rodadas seguidas (sem alarme falso por oscilação da rede).
// Não grava nada: o app abre sem banco configurado e o painel usa só a chave de leitura que já está publicada nele.
// Uso: node tests/canario.cjs                      (3 rodadas, 1 por minuto)
//      node tests/canario.cjs --rodadas 1           (uma conferência rápida)
//      node tests/canario.cjs --site https://wiapps.com.br/wigo/
const { chromium, devices } = require("playwright");
const fs = require("fs"), path = require("path");
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SITE = (arg("--site") || "https://wiapps.com.br/wigo/").replace(/\/?$/, "/");
const RODADAS = +arg("--rodadas") || 3, INTERVALO = (+arg("--intervalo") || 60) * 1000;
const local = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8").match(/VERSAO_APP = "(v\d+)"/)[1];

async function rodada(nav) {
  const ctx = await nav.newContext({ ...devices["Pixel 7"], serviceWorkers: "block" });
  // o app no ar não pode gravar na planilha durante a conferência
  await ctx.route(/script\.google(usercontent)?\.com/, (r, q) => q.method() === "POST" ? r.abort() : r.continue());
  const R = { erros: [], falhas: [] }, t0 = Date.now();
  const p = await ctx.newPage();
  p.on("pageerror", e => R.erros.push("app: " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/favicon|ERR_FAILED|net::/i.test(m.text())) R.erros.push("app (console): " + m.text().slice(0, 200)); });
  p.on("response", r => { if (r.status() >= 400 && r.url().startsWith(SITE)) R.falhas.push(`${r.status()} ${r.url().replace(SITE, "")}`); });
  try {
    const sw = await (await fetch(SITE + "sw.js", { cache: "no-store" })).text();
    R.sw = (sw.match(/armacao-(v\d+)/) || [])[1];
    await p.goto(SITE, { waitUntil: "load", timeout: 60000 });
    await p.waitForFunction(() => window.__wigoOk === true, null, { timeout: 30000 });
    R.app = await p.evaluate(() => VERSAO_APP); R.abre = Date.now() - t0;
    R.telaBranca = await p.evaluate(() => !document.querySelector(".tela:not([hidden])"));
  } catch (e) { R.erros.push("app não abriu: " + e.message.split("\n")[0]); }
  // painel (só leitura)
  const q = await ctx.newPage();
  q.on("pageerror", e => R.erros.push("painel: " + e.message));
  try { const r = await q.goto(SITE + "painel/", { waitUntil: "load", timeout: 60000 }); if (!r.ok()) R.falhas.push(`${r.status()} painel/`); await q.waitForTimeout(4000);
    R.painel = await q.evaluate(() => document.body.innerText.length > 200); } catch (e) { R.erros.push("painel não abriu: " + e.message.split("\n")[0]); }
  await ctx.close();
  return R;
}

(async () => {
  const nav = await chromium.launch(), hist = [];
  console.log(`CANÁRIO ${SITE} · versão do repositório ${local} · ${RODADAS} rodada(s)\n`);
  for (let i = 0; i < RODADAS; i++) {
    if (i) await new Promise(r => setTimeout(r, INTERVALO));
    const R = await rodada(nav); hist.push(R);
    const ok = !R.erros.length && !R.falhas.length && R.sw === local && R.app === local && !R.telaBranca && R.painel;
    console.log(`rodada ${i + 1}: ${ok ? "ok" : "PROBLEMA"} · sw.js ${R.sw || "?"} · app ${R.app || "?"} · abriu em ${R.abre ? (R.abre / 1000).toFixed(1) + " s" : "–"} · painel ${R.painel ? "ok" : "?"}`
      + (R.erros.length ? `\n   erros: ${R.erros.slice(0, 5).join(" | ")}` : "") + (R.falhas.length ? `\n   arquivos com erro: ${R.falhas.slice(0, 5).join(", ")}` : ""));
  }
  await nav.close();
  // alerta = o mesmo problema em 2 rodadas seguidas (ou na única rodada pedida)
  const chave = R => [R.sw !== local && "versão do sw.js", R.app !== local && "versão do app", R.telaBranca && "tela branca", !R.painel && "painel vazio", ...R.erros, ...R.falhas].filter(Boolean);
  const ult = chave(hist.at(-1)), pen = hist.length > 1 ? chave(hist.at(-2)) : ult, firmes = ult.filter(x => pen.includes(x));
  if (firmes.length) { console.log(`\nALERTA (repetiu): ${firmes.join(" · ")}`); process.exit(1); }
  console.log(ult.length ? `\nOscilou só na última rodada (sem alerta): ${ult.join(" · ")}` : "\nNo ar e saudável.");
})().catch(e => { console.error(e); process.exit(1); });
