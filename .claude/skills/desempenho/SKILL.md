---
name: desempenho
description: Mede quanto o Wigo demora para abrir e trocar de tela num celular simples e compara com a referência, para pegar lentidão antes de publicar. Use quando pedirem "está lento", "demora para abrir", "medir velocidade", "desempenho", "benchmark", ou depois de mudar algo pesado (bibliotecas, sincronização, telas grandes, index.html crescendo).
---

# Desempenho do Wigo

Adaptado do `/benchmark` do gstack (MIT, Garry Tan). **Regra: medir antes de mexer.** O histórico do projeto tem
"melhorias de velocidade" que não mudavam nada (ver os PDFs de projeto).

## Rodar
```
node tests/desempenho.cjs                        # mede (3 rodadas) e compara com tests/desempenho-base.json
node tests/desempenho.cjs --base                 # grava a referência nova (só depois de uma melhoria confirmada)
node tests/desempenho.cjs --rodadas 5 --rigido   # sai com erro se estourar o orçamento ou piorar mais de 20%
```
Precisa do `playwright` (Chromium). Neste PC, aponte `NODE_PATH` para a pasta com `node_modules` (veja o skill `publicar`).

O teste simula **celular simples** (CPU 6× mais lenta) e **4G lento** (1,6 Mb/s, 150 ms), com usuário liberado e o Google bloqueado.
- **App pronto (dia a dia):** abrindo com o app guardado pelo `sw.js`. É o número que importa para a obra. Orçamento 3 s.
- **App pronto (1ª vez):** baixando tudo (convite novo, celular trocado). Orçamento 8 s.
- **Travadas do JS:** soma do tempo das tarefas acima de 50 ms (a tela não responde nesse tempo).
- **Abrir cada tela:** do toque até a tela desenhada. Orçamento 600 ms.
- **Tamanho do index.html:** orçamento 1,3 MB.

## Ler o resultado
- "⚠ piorou" = mais de 20% pior que a referência. Rode de novo antes de concluir (a máquina oscila); confirme com `--rodadas 5`.
- "Mais lentos ao abrir" mostra os arquivos que mais demoram (imagem grande, fonte, JSON).
- Um celular específico lento: Painel Dev › **Aparelhos** mostra quanto cada celular leva para abrir e sincronizar (script 38+).
  Se só um aparelho é lento, o problema é o aparelho ou a rede dele, não o app.

## Melhorar (uma coisa por vez, medindo antes e depois)
- Trabalho pesado na abertura: adie para depois do `__wigoOk` ou para quando a tela abrir.
- Listas grandes: desenhe só o visível (`S.limit`); use `memoEf` para não recalcular por linha.
- Imagem ou arquivo grande: reduza ou carregue só quando precisar (lembre do cache no `sw.js`).
- Biblioteca nova: carregue sob demanda (como `loadXLSX`), nunca no topo.
- Melhoria confirmada: `--base` e commit da referência junto.

## Relatório
A tabela da saída do script, o que mudou desde a referência, a causa provável do que piorou (com a evidência) e o próximo passo.
