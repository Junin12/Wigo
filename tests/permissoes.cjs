// Confere que as permissões que o script confere (apps-script/Code.gs: CARGOS_, FUNCOES_) são as mesmas do app
// (index.html: CARGOS, FUNCOES). Mudou um cargo ou uma função no app? Mude a cópia no Code.gs também.
// Uso: node tests/permissoes.cjs
const fs = require("fs"), path = require("path"), vm = require("vm");
const RAIZ = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8"), gs = fs.readFileSync(path.join(RAIZ, "apps-script", "Code.gs"), "utf8");
const pega = (txt, re) => { const m = txt.match(re); if (!m) throw new Error("não achei " + re); return m[0]; };
const ler = (txt, res, nomes) => vm.runInNewContext(res.map(re => pega(txt, re)).join("\n") + `\n;({${nomes}})`);
const A = ler(app, [/const TODOS_MODULOS="[^"]*";/, /const TUDO="[^"]*";/, /const CARGOS=\{[\s\S]*?\n\};/, /const FUNCOES=\[[\s\S]*?\n\];/], "CARGOS, FUNCOES");
const G = ler(gs, [/const TODOS_MODULOS_ = '[^']*';/, /const TUDO_ = '[^']*';/, /const CARGOS_ = \{[\s\S]*?\n\};/, /const FUNCOES_ = \[[\s\S]*?\n\];/], "CARGOS_, FUNCOES_");

const falhas = [];
const confere = (ok, msg) => { if (!ok) falhas.push(msg); };
const lista = s => s.split(" ").filter(Boolean).sort().join(" ");
const cargosApp = Object.keys(A.CARGOS).filter(c => !A.CARGOS[c].dev);
confere([...cargosApp].sort().join("|") === Object.keys(G.CARGOS_).sort().join("|"),
  "cargos diferentes: app " + cargosApp.join(", ") + " · script " + Object.keys(G.CARGOS_).join(", "));
for (const c of cargosApp) {
  const a = A.CARGOS[c], g = G.CARGOS_[c];
  if (!g) continue;
  confere(lista(a.m) === lista(g.m), `${c}: módulos diferentes (app "${a.m}" · script "${g.m}")`);
  confere(lista(a.x) === lista(g.x), `${c}: permissões de edição diferentes (app "${a.x}" · script "${g.x}")`);
}
const fApp = A.FUNCOES.filter(f => f.ed.length), fGs = new Map(G.FUNCOES_.map(f => [f.id, f]));
confere(fApp.length === G.FUNCOES_.length, `funções com edição: app ${fApp.map(f => f.id).join(" ")} · script ${G.FUNCOES_.map(f => f.id).join(" ")}`);
for (const f of fApp) {
  const g = fGs.get(f.id);
  confere(!!g, `função ${f.id} falta no script`);
  if (g) confere(f.ed.join(" ") === g.ed.join(" ") && !!f.edPadrao === !!g.edPadrao && !!f.semModulo === !!g.semModulo, `função ${f.id} diferente no script`);
}
if (falhas.length) { falhas.forEach(m => console.log("FALHA " + m)); process.exit(1); }
console.log(`ok   permissões do script iguais às do app (${cargosApp.length} cargos, ${fApp.length} funções)`);
