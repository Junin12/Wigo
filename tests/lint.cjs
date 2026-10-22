// Prepara o código para o oxlint: o JavaScript do app fica dentro do index.html e do painel.html.
// Copia cada <script> (sem src) para tests/lint-saida/<arquivo>.js na MESMA linha e coluna do HTML,
// com o resto em branco: o número de linha que o oxlint acusa é o do HTML.
// Uso: node tests/lint.cjs && npx oxlint -c tests/oxlintrc.json tests/lint-saida
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, ".."), SAIDA = path.join(__dirname, "lint-saida");
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA, { recursive: true });
for (const arq of ["index.html", "painel.html"]) {
  const html = fs.readFileSync(path.join(RAIZ, arq), "utf8"), linhas = html.split("\n").map(() => "");
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m, n = 0;
  while ((m = re.exec(html))) {
    if (/\bsrc=|type=["']?application\/(ld\+)?json/i.test(m[1] || "")) continue;
    const ini = m.index + m[0].indexOf(">") + 1, antes = html.slice(0, ini), l0 = antes.split("\n").length - 1, col = ini - (antes.lastIndexOf("\n") + 1);
    m[2].split("\n").forEach((t, k) => { linhas[l0 + k] = (k ? "" : " ".repeat(col)) + t.replace(/\r$/, ""); });
    n++;
  }
  fs.writeFileSync(path.join(SAIDA, arq.replace(/\.html$/, ".js")), linhas.join("\n"));
  console.log(`${arq}: ${n} script(s)`);
}
fs.copyFileSync(path.join(RAIZ, "sw.js"), path.join(SAIDA, "sw.js"));
