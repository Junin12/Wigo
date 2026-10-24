---
name: canario
description: Confere o Wigo no ar depois de publicar (versão certa, app e painel abrindo sem erro), alertando só o que se repete. Use logo depois de publicar, quando pedirem "vê se está no ar", "conferir o site", "o app quebrou para todo mundo?", ou quando o Painel Dev mostrar muitos erros novos.
---

# Canário: o Wigo no ar

Adaptado do `/canary` do gstack (MIT, Garry Tan). **Só alerta o que se repete em 2 rodadas seguidas**: rede oscilando não é problema.

## Rodar
```
node tests/canario.cjs                       # 3 rodadas, 1 por minuto, em https://wiapps.com.br/wigo/
node tests/canario.cjs --rodadas 1           # conferência rápida
node tests/canario.cjs --site <endereço>     # outro endereço
```
Cada rodada abre o app como um celular novo (Pixel 7, sem cache) e confere:
- `sw.js` e `VERSAO_APP` no ar iguais à versão do repositório;
- o app inicia (`__wigoOk`) sem erro de JavaScript, sem tela branca e sem arquivo do site com erro 4xx/5xx;
- o painel (`/wigo/painel/`) abre com dados (só leitura, pela chave que já está publicada nele).

O teste **não grava nada**: os pedidos POST ao Google são bloqueados.

## Depois de publicar (junto com o skill `publicar`)
1. CI verde → `node tests/canario.cjs`.
2. Versão antiga no ar logo depois do CI: o FTP pode levar 1–2 min. Rode de novo antes de alertar.
3. Algumas horas depois (ou no dia seguinte): Painel Dev › **Aparelhos** (quantos já estão na versão nova, lentos, lançamentos parados)
   e os erros (`dev/erro`). Erro novo em vários celulares = investigar (skill `investigar`).

## Se der ALERTA
- Mostre ao usuário: o quê, desde quando e a evidência (mensagem, arquivo).
- Opções: investigar agora; esperar mais uma rodada (se for rede); **voltar a versão** (`git revert` do commit e publicar de novo,
  nunca `--force` no `main`); descartar (falso alarme).
- Voltar a versão é decisão do usuário.

## Relatório
`No ar: vNNN · app ok · painel ok · N rodadas`, ou o alerta com a evidência.
