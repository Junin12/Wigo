---
name: saude
description: Painel de saúde do código do Wigo (lint, testes, permissões, acessibilidade, desempenho, versões), com nota de 0 a 10 e a tendência. Use quando pedirem "saúde do código", "como está o projeto", "qualidade do código", "dívida técnica", antes de uma rodada grande de mudanças ou uma vez por semana.
---

# Saúde do código do Wigo

Adaptado do `/health` do gstack (MIT, Garry Tan). Só mede e recomenda; **não corrige nada sem o usuário pedir.**

## 1. Rodar tudo (guarde a saída completa de cada um)
| Item (peso) | Comando | 10 | 7 | 4 | 0 |
|---|---|---|---|---|---|
| Lint (20%) | `node tests/lint.cjs` e `npx oxlint@1.86.0 -c tests/oxlintrc.json tests/lint-saida` | limpo | < 5 avisos | < 20 | erro |
| Testes (30%) | `node tests/smoke.cjs` | tudo ok | 1 falha | 2–3 | > 3 ou não roda |
| Permissões (10%) | `node tests/permissoes.cjs` | iguais | | | diferentes |
| Acessibilidade (10%) | `node tests/acessibilidade.cjs` | nada | < 5 pontos | < 20 | ≥ 20 |
| Desempenho (20%) | `node tests/desempenho.cjs` | tudo no orçamento | 1 atenção | 1 falha | > 1 falha |
| Versões (10%) | `sw.js` × `VERSAO_APP` × no ar (`wiapps.com.br/wigo/sw.js`); `SCRIPT_MIN` ≤ script no ar | tudo igual | | | diferente |

Apague `tests/lint-saida/` no fim. Nota geral = média ponderada, calculada com `node -e` (não de cabeça).
Item que não rodou fica fora da conta: diga qual e por quê.

## 2. Olhar também (sem nota)
- Tamanho do `index.html`, `painel.html` e `Code.gs` (KB) e as 10 maiores funções do `index.html`.
- Funções embrulhadas várias vezes (`const o=X; X=function…`): quantas e quais. Muitas camadas na mesma função = risco.
- `TODO`, `FIXME` e "por enquanto" no código.
- Commits de correção nas últimas 2 semanas: onde se concentram = parte frágil.

## 3. Painel
```
SAÚDE DO WIGO · vNNN · <data>
Lint 10 · Testes 10 · Permissões 10 · Acessibilidade 10 · Desempenho 7 · Versões 10
NOTA: 9,4 / 10   (anterior: 9,1 em <data>)
```
Depois, as 3 recomendações de maior efeito, cada uma com o item, a evidência e o skill que resolve
(`investigar`, `desempenho`, `revisar-design`, `seguranca`, `testar-app`).

## 4. Histórico
Acrescente uma linha em `tests/saude-historico.jsonl` (`{"em":"AAAA-MM-DD","versao":"vNNN","nota":9.4,"itens":{…}}`)
e compare com a anterior: o que subiu, o que caiu e por quê. Commit: `saude: vNNN nota N`.
