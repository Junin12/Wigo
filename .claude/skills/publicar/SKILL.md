---
name: publicar
description: Publica uma mudança do Wigo do jeito do projeto (versão, verificação, commit no main, CI e conferência no ar). Use quando pedirem "publicar", "subir", "mandar pro ar", "commitar e publicar" ou ao terminar qualquer mudança no app, no painel ou no script da planilha.
---

# Publicar o Wigo

Adaptado do `/ship` do gstack (MIT, Garry Tan), reduzido ao fluxo deste repositório: commit direto no `main`,
o GitHub Actions testa (oxlint + Playwright) e só então envia por FTP para wiapps.com.br/wigo.

**Regra de ferro: não dizer "publicado" sem ver o CI verde e a versão nova no ar.**

## 1. Antes de mexer na versão
- `git status` e `git log --oneline -5`: saber o que entra. Nada de arquivo de teste solto, `tests/lint-saida/`, PDFs de amostra ou chaves.
- `git pull --ff-only` para não publicar em cima de uma versão velha.
- Procure segredos no que vai entrar: `git diff --cached; git diff` sem `TOKEN`, chave de leitura, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, senha de FTP.

## 2. Versão (sempre as duas juntas)
- `sw.js`: `const VERSAO = "armacao-vNNN";`
- `index.html`: `const VERSAO_APP = "vNNN";` (o comentário ao lado cita o mesmo número).
- NNN = atual + 1. Confira com `grep -n "VERSAO" sw.js` e `grep -n "VERSAO_APP =" index.html`: os números precisam bater.
- Arquivo novo que o app carrega? Ele precisa estar na lista de cache do `sw.js`.

## 3. Verificar antes do push
- Se houver Node: `node tests/lint.cjs` e `npx --yes oxlint@1.86.0 -c tests/oxlintrc.json tests/lint-saida`, depois `node tests/smoke.cjs`
  (sem internet: `WIGO_LIBS=<node_modules com jspdf, jspdf-autotable, pdfjs-dist, xlsx>`).
- Sem Node nesta máquina: abra o app no preview (`hub-wigo`, http://localhost:8093/wigo/) e confira no console que não há erro de JavaScript
  ao abrir e na tela mexida. O CI continua sendo a barreira final.
- Mudou uma função importante? Acrescente uma linha `confere(...)` em `tests/smoke.cjs` que falharia sem a mudança.

## 4. Commit e push
- Mensagem em português, dizendo o que muda para quem usa (ex.: `v145: Qualidade mostra o laudo do lab ao lado do ensaio`). Autor Junin12.
- Mudanças sem relação vão em commits separados.
- `git push origin main`. Nunca `--force` no `main` (ele publica sozinho).

## 5. Conferir o CI e o ar
- Acompanhe o workflow "Publicar na HostGator" (Actions). Sem `gh`, use a API pública:
  `https://api.github.com/repos/Junin12/Wigo/actions/runs?branch=main&per_page=1`.
- Falhou no oxlint: leia as anotações em `.../check-runs/<id>/annotations` (linha = linha do `index.html`/`painel.html`), corrija e publique de novo com a **mesma** versão se nada subiu.
- Verde: abra `https://wiapps.com.br/wigo/sw.js` e confirme `armacao-vNNN`.

## 6. Script da planilha (só se `apps-script/` mudou)
O CI não publica o Apps Script. No Chrome, projeto "CAU - Armação": confira que o texto no ar é igual ao do commit anterior,
cole o arquivo exato de `raw.githubusercontent.com/Junin12/Wigo/<commit>/apps-script/Code.gs` no modelo do editor (`window.monaco`),
Ctrl+S, Implantar › Gerenciar implantações › lápis › Nova versão. Depois confirme pela chave de leitura que `script` é o número novo.
Atualize `apps-script/LEIA-ME.md` com o número.

## 7. Novidades para os usuários
Se a mudança é visível, proponha 1 a 3 frases curtas para o Painel Dev › Avisos › Novidades (chave `NOVIDADES`) e entregue o texto pronto para colar.

## Relatório final
```
Versão: vNNN (sw.js e index.html)
Commit: <sha> <mensagem>
CI: verde | falhou em <etapa>
No ar: armacao-vNNN confirmado | não confirmado (motivo)
Script: sem mudança | versão N publicada
Novidades: <texto sugerido>
```
