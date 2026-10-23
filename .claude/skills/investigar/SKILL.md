---
name: investigar
description: Depuração do Wigo pela causa raiz, sem chute. Use quando aparecer erro, travamento, "parou de funcionar", "sumiu", relato de falha vindo do Painel Dev (dev/falha, dev/erro), número errado em relatório ou diferença entre o celular e o painel.
---

# Investigar um problema no Wigo

Adaptado do `/investigate` do gstack (MIT, Garry Tan).

**Regra de ferro: nenhuma correção sem causa raiz.** Corrigir o sintoma só muda o erro de lugar.

## 1. Juntar os sintomas
- Mensagem de erro, tela, cargo do usuário, versão do app (`VERSAO_APP`), versão do script, aparelho.
- Painel Dev: aba **Diagnóstico**, **Aparelhos** (versão e pendências de cada celular) e os registros `dev/erro` / `dev/falha`.
  O "Pacote para o Claude" já junta tudo: peça ao usuário para colar se não veio.
- Falta informação? Faça UMA pergunta por vez.

## 2. Ler o caminho do código
- Do sintoma para trás: `grep -n` no `index.html` (o app é um arquivo só), no `painel.html` e em `apps-script/Code.gs`.
- Atenção aos padrões do projeto: funções declaradas são **embrulhadas** depois (`marcar`, `addReg`, `renderFotos`,
  `renderRelatorios`…). Procure todas as reatribuições antes de concluir o que uma função faz.
- Permissões passam por `cargoEf()`/`pode()`/`podeLanc()`; o "Ver como" (`VER_COMO`) muda o que o Dev vê.
- `git log --oneline -20 -- <arquivo>` e `git log -S "<trecho>"`: funcionava antes? Regressão = a causa está num diff.

## 3. Reproduzir
- Preview `hub-wigo` (http://localhost:8093/wigo/), largura 375 px, mesmo cargo (use "Ver como").
- Erro de sintaxe sem linha: carregue o script como Blob e leia `lineno` do evento `error`.
- Diferença celular × planilha: compare o que o app mandou (`ops`) com o que `aplicar()` gravou no script.
- Cache velho é suspeito comum: o `sw.js` tem a versão certa? O usuário está com a versão nova (aba Aparelhos)?

Saída obrigatória: **"Hipótese da causa: …"**, uma frase que dá para testar.

## 4. Testar a hipótese
- Prove com log temporário, `evaluate` no preview ou leitura da planilha. Se não bater, volte ao passo 1.
- **3 hipóteses erradas → pare** e pergunte ao usuário: continuar com uma nova hipótese, instrumentar e esperar acontecer de novo, ou rever a arquitetura daquela parte.
- Sinais de alerta: "conserto rápido por enquanto", correção antes de entender o fluxo dos dados, cada conserto abrindo outro problema.

## 5. Corrigir
- A menor mudança que remove a causa. Sem refatorar o vizinho.
- Uma linha em `tests/smoke.cjs` que falharia sem a correção, quando o smoke consegue chegar lá.
- Mais de 5 lugares diferentes mexidos? Pergunte antes de seguir.
- Publique com o skill `publicar`.

## Relatório
```
Sintoma:     o que o usuário viu
Causa raiz:  o que estava errado de fato
Correção:    arquivo:linha
Prova:       como foi reproduzido antes e confirmado depois
Teste:       linha nova no smoke.cjs (ou por que não deu)
Situação:    RESOLVIDO | RESOLVIDO COM RESSALVAS | BLOQUEADO
```
