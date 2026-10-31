---
name: gravar-tutorial
description: Prepara, grava e edita vídeos-tutorial do Wigo (como lançar aço, fazer o RDO por voz, registrar concretagem) com o Recordly e o video-use, para treinar a equipe ou publicar pela Central de Conteúdo. Use quando pedirem "gravar tutorial", "vídeo de treinamento", "ensinar a equipe a usar", "vídeo mostrando o app".
---

# Gravar tutorial do Wigo

Ferramentas já instaladas neste PC:
- **Recordly** (gravador de tela com zoom automático e cursor suave): atalho na Área de Trabalho; programa em `%LOCALAPPDATA%\Programs\Recordly`.
- **video-use** (skill global): corta pausas e "éé", legenda e exporta. Ver a skill `editar-filmagem` da Central (`central-conteudo-ia\.claude\skills`).

## 1. Antes de gravar (com o usuário)

1. Combine **um assunto por vídeo**, de 1 a 3 minutos. Escreva o roteiro em passos curtos: o que tocar, em que ordem, o que falar.
   Use a tela e os nomes de botões reais do `index.html` (leia a função da tela antes de escrever).
2. **Grave no ambiente de teste**, nunca na planilha da obra: planilha com "TESTE" no nome (menu WIGO › Criar ambiente de teste,
   faixa vermelha no app). Assim não aparecem nomes de trabalhadores, valores reais nem dados do cliente.
3. Tamanho da tela: para mostrar como fica no celular, abra `https://wiapps.com.br/wigo/` no Chrome com a ferramenta de
   desenvolvedor no modo celular (F12 › ícone de celular, 390×844). Para o painel/computador, janela normal.
4. Feche notificações (WhatsApp, e-mail) e abas com dados pessoais.

## 2. Gravar (Recordly)

- Grave só a janela do Chrome (não a tela inteira). Microfone ligado; câmera em bolha só se o usuário quiser aparecer.
- Deixe o zoom automático ligado: ele aproxima onde houve clique, o que ajuda no celular.
- Fale devagar e pare 1 segundo entre os passos: o video-use corta essas pausas depois.
- Exporte em MP4 para uma pasta própria do tutorial (ex.: `Documentos\Tutoriais Wigo\rdo-por-voz\`).

## 3. Editar (video-use)

Na pasta do vídeo, siga a skill `editar-filmagem`: transcrição em português, cortar pausas e repetições, legenda,
e saída em `edit/final.mp4`. Para tutorial, legendas mais longas (frases inteiras) leem melhor que 2 palavras por vez.

## 4. Entregar

- **Treinamento da equipe:** mande o `final.mp4` pelo canal que o usuário escolher, ou suba para a pasta "Arquivos" do Drive pelo
  Arquivo da obra › Enviados do Wigo (até 60 MB).
- **Conteúdo público (Central):** importe com `src/importar.ts` da Central (ver `editar-filmagem`) e agende pelo painel.
  Só publique com o ok do usuário e se nada da obra do cliente aparecer.
