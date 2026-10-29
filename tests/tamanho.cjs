// Orçamento de tamanho: a publicação falha se o app crescer além do combinado (o index.html é um arquivo só).
// Hoje (v164) ~1,16 MB e ~390 KB comprimido (gzip nível 6). Passou? Antes de subir o limite, veja se dá para carregar a parte nova só quando abrir.
// Uso: node tests/tamanho.cjs
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const LIMITES = { "index.html": { bruto: 1.35e6, gzip: 450e3 }, "painel.html": { bruto: 160e3, gzip: 45e3 }, "sw.js": { bruto: 20e3, gzip: 8e3 } };
let falhou = 0;
for (const [arq, lim] of Object.entries(LIMITES)) {
  const b = fs.readFileSync(path.join(__dirname, "..", arq)), g = zlib.gzipSync(b, { level: 6 }).length;
  const ok = b.length <= lim.bruto && g <= lim.gzip; if (!ok) falhou++;
  const kb = v => Math.round(v / 1024) + " KB";
  console.log(`${ok ? "ok  " : "FALHA"} ${arq}: ${kb(b.length)} (limite ${kb(lim.bruto)}) · comprimido ${kb(g)} (limite ${kb(lim.gzip)}) · ${Math.round(b.length / lim.bruto * 100)}% do orçamento`);
}
if (falhou) { console.log("\nO app passou do orçamento de tamanho. Veja o skill desempenho."); process.exit(1); }
