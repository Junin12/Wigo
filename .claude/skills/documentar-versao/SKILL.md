---
name: documentar-versao
description: Depois de publicar, atualiza o que documenta a versão do Wigo (histórico de versões, LEIA-ME do script, planos em docs/, texto das Novidades) para bater com o que foi ao ar. Use depois de publicar uma versão, quando pedirem "atualiza a documentação", "registra no histórico", "escreve as novidades", ou quando o histórico estiver atrasado.
---

# Documentar a versão do Wigo

Adaptado do `/document-release` do gstack (MIT, Garry Tan). **Documenta o que foi ao ar, não o que se pretendia fazer:**
leia o diff, não a memória da conversa.

## 1. O que mudou
- `git log --oneline <última versão documentada>..HEAD` e `git diff --stat` do mesmo intervalo.
- Separe: **novo para quem usa**, **mudou o jeito de usar**, **correção**, **só técnico** (testes, CI, script sem efeito visível).

## 2. Onde atualizar
| Onde | Quando | O quê |
|---|---|---|
| `HISTORICO_VERSOES.md`, na pasta do projeto no OneDrive (**fora do repositório**: `app-armacao\app-armacao\documentos\`) | toda versão | uma linha por versão (`\| vNNN \| o que mudou para quem usa \| script \|`) e a "Versão atual" no fim |
| `apps-script/LEIA-ME.md` | o script mudou | "Versão N: …" no topo da lista, e se o app funciona com o script anterior |
| `docs/*.md` (planos) | item de um plano foi feito | marque como feito, com a versão |
| Novidades (Painel Dev › Avisos) | mudança visível | 1–3 frases curtas para quem usa; o botão "Montar a partir dos commits" dá o rascunho. Entregue o texto pronto: quem publica é o Dev |
| Memória do Claude (`projeto-wigo`) | mudou versão, endereço, jeito de publicar ou de testar | a linha que ficou velha |

## 3. Regras
- Português de obra, frases curtas, o efeito para quem usa ("o início avisa chuva na concretagem"), não o nome da função.
- Nada de senha, chave de leitura, TOKEN ou endereço do `/exec` nos documentos.
- Não apague histórico: só acrescente ou corrija o que estava errado.
- Documentos do repositório (`apps-script/`, `docs/`) vão em commit próprio: `docs: vNNN`. Os do OneDrive não entram no Git.

## Relatório
Lista do que foi atualizado (arquivo → o que entrou) e o texto das Novidades pronto para colar.
