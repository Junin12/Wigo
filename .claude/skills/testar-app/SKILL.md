---
name: testar-app
description: Teste de uso do Wigo no navegador (QA), corrigindo o que achar. Use quando pedirem "testa o app", "vê se funciona", "procura bug", "QA", ou quando uma mudança grande ficar pronta antes de publicar.
---

# Testar o Wigo como usuário

Adaptado do `/qa` do gstack (MIT, Garry Tan): testar → corrigir → verificar, com prova de cada conserto.

## Preparação
- `git status` limpo. Se não estiver, pergunte: commitar antes, ou testar sem corrigir.
- Abra o preview `hub-wigo` (http://localhost:8093/wigo/) no navegador embutido, largura **375 px** (é um app de celular).
- O teste não grava na planilha de verdade: bloqueie `script.google.com` / `script.googleusercontent.com`
  ou use dados locais. Nunca crie registros reais para testar.
- Alcance padrão: o que mudou desde a última publicação (`git diff` do último commit de versão) e as telas vizinhas.
  "Completo" = todos os módulos.

## O que olhar em cada tela
1. Console sem erro ao abrir, ao trocar de aba e ao salvar.
2. Cada cargo vê só o que deve (use "Ver como"): Mestre de obras só Produção, Ponto, Fotos, Ferramentas;
   lançamentos de produção editáveis só por Engenheiro de produção e Desenvolvedor; PDF só para `pdf:true`; números da home só `dash:true`.
3. Formulário: campo vazio, número com vírgula, data no futuro, texto longo; salvar duas vezes seguidas não duplica.
4. Sem internet (offline): abre pelo cache, grava na fila e sincroniza ao voltar.
5. Botão Voltar do Android fecha a sobreposição (Ferramentas, fotos) em vez de sair do app.
6. PDFs e planilhas gerados abrem e têm os números da tela.
7. Texto cortado, botão fora da tela, rolagem horizontal em 375 px.

## Gravidade
- **Crítico**: perde ou corrompe dado, app não abre, permissão vazando.
- **Alto**: função principal não funciona.
- **Médio**: funciona com contorno.
- **Baixo**: visual.
Por padrão corrija crítico, alto e médio; o baixo vai para a lista.

## Laço de correção (um problema por vez)
1. Reproduza e anote o passo a passo.
2. Se o smoke alcança, escreva antes a linha em `tests/smoke.cjs` que falha.
3. Menor correção possível (siga o skill `investigar` se a causa não for óbvia).
4. Repita o passo que falhava e a tela vizinha; tire print de antes e depois.
5. Um commit por correção: `fix(teste): <o que estava errado>`.
- Pare e mostre ao usuário depois de 2 correções desfeitas, de mexer num arquivo sem relação, ou a cada 5 correções.

## Relatório
Tabela: problema, gravidade, situação (corrigido / corrigido sem prova completa / adiado), commit, prova.
No fim: pronto para publicar ou não, e por quê. Publicar é com o skill `publicar`.
