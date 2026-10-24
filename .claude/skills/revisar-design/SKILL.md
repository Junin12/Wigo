---
name: revisar-design
description: Revisão visual e de uso do Wigo com olho de designer (hierarquia, espaçamento, contraste, toque com luva, textos), corrigindo o que achar com print de antes e depois. Use quando pedirem "revisar o design", "está feio", "melhorar o visual", "deixar mais fácil de usar", "polir a tela X" ou antes de mostrar o app para alguém.
---

# Revisar o design do Wigo

Adaptado do `/design-review` do gstack (MIT, Garry Tan), reduzido ao que importa num app de obra usado no celular,
muitas vezes no sol, com pressa e às vezes de luva.

## Princípios (valem para todo achado)
1. **Não me faça pensar.** Se a pessoa para e pensa "onde eu toco?", a tela falhou.
2. **Três toques óbvios valem mais que um toque com dúvida.**
3. **Corte texto, depois corte de novo.** Instrução longa na tela é sinal de tela confusa. Ajuda fica atrás do `?` (modo campo).
4. **O que é tocável parece tocável** (não existe hover no celular). Área de toque ≥ 44 px; no modo campo, maior.
5. **O mais importante é o mais visível.** Um botão principal por tela.
6. **Clareza vence consistência**, mas siga os padrões do app: `.card`, `.btn`/`.btn.pri`, `.chip ok|and|bad`, `efModal`, `toast`,
   cores por token (`--accent`, `--good`, `--warn`, `--bad`; nada de cor solta), tema claro/escuro e `html[data-campo]`.

## 1. Escopo
- Padrão: as telas mexidas desde a última publicação (`git diff` do último commit de versão) e as vizinhas.
- "Completo": início, Lançar, Produtividade, Concreto, Suprimentos › Aço, Ponto, Produção, Fotos, RDO, Qualidade, Segurança, Painel Dev.

## 2. Ver de verdade (prints, não imaginação)
Com Playwright (o jeito de servir o app está em `tests/smoke.cjs`): `devices["Pixel 7"]`, `serviceWorkers:"block"`, Google bloqueado,
usuário de teste liberado no `localStorage` (`arm:usuario`, `arm:acesso` com `status:"liberado"`, `arm:tour:<cargo>` = 1).
Para cada tela: print no **claro**, no **escuro** (`colorScheme:"dark"`) e no **modo campo** (`arm:campo` = true).
Confira também 320 px de largura (celular pequeno): nada de rolagem para o lado (`document.documentElement.scrollWidth`).

## 3. Lista de conferência (anote só o que achar, com print)
- **Hierarquia:** dá para saber em 3 s para que serve a tela? Um botão principal? Nada brigando por atenção?
- **Texto:** corpo ≥ 16 px, rótulos ≥ 12 px; números em colunas com `font-variant-numeric: tabular-nums`; reticências `…`; sem texto cortado.
- **Cor e contraste:** AA (4,5:1 no texto, 3:1 em ícone e borda de campo); verde/amarelo/vermelho sempre com texto junto, não só cor.
  `node tests/acessibilidade.cjs` acha o grosso.
- **Espaço:** espaçamentos da escala do app; itens relacionados juntos, seções separadas; `env(safe-area-inset-*)` em barras fixas.
- **Estados:** carregando ("Carregando…"), vazio (mensagem + o que fazer), erro (o que houve + como resolver), desabilitado, foco visível.
- **Toque:** ≥ 44 px, sem dois botões colados; ação perigosa com confirmação ou desfazer.
- **Textos:** verbos claros ("Gerar pedido de aço", não "OK"); sem "Bem-vindo ao…"; termos da obra (romaneio, lance, FVS), não de TI.
- **Movimento:** curto (≤ 300 ms), respeita `prefers-reduced-motion`; nada de `transition: all`.
- **Cara de "feito por IA":** emoji como enfeite em título, gradiente roxo, cartões todos iguais e centralizados, borda colorida à esquerda.

## 4. Corrigir (um achado por vez)
- Impacto: **alto** (atrapalha usar) / **médio** / **polimento**. Corrija alto e médio; polimento vai para a lista.
- A menor mudança no CSS/JS do `index.html`; tokens, não cores novas.
- Print de **antes e depois** no mesmo tamanho; confira claro, escuro e campo.
- Um commit por correção: `design: <o que melhorou para quem usa>`.
- Pare e mostre ao usuário a cada 5 correções, ou se a correção mudar o jeito de usar (não só a aparência).

## Relatório
Tabela: tela, achado, impacto, situação (corrigido / adiado), commit, prints. No fim: nota geral (A–F) e as 3 próximas melhorias.
Publicar é com o skill `publicar`.
