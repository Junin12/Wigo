# Script da planilha (Google Apps Script)

O app grava e lê os dados por um script ligado à planilha do Google (Extensões → Apps Script).

## Code.gs
Cópia do script publicado no Apps Script (sem senhas: a senha do app, TOKEN, e a do desenvolvedor, DEV_SENHA,
ficam nas Propriedades do script). Quando mudar o script aqui, cole no Apps Script e publique:
**Implantar → Gerenciar implantações → lápis ✏️ → Versão: Nova versão → Implantar** (o endereço /exec não muda).

Versão 38: a aba Aparelhos ganha a coluna TEMPOS (tempo para abrir o app e para sincronizar, de cada celular), mostrada
no Painel Dev › Aparelhos. Com o script 37 o app funciona igual, só sem esses tempos.

Versão 37: troca de senha com código no WhatsApp do desenvolvedor (ações `senhaCodigo` e `senhaTrocar`): a senha do
Desenvolvedor (Painel Dev › Senhas, ou "Esqueci a senha" na tela de entrada) e a senha do app (TOKEN, só o Dev; os outros
celulares precisam do convite novo). Código de 6 números, vale 10 minutos, 5 tentativas, no máximo 3 códigos por hora.
O envio é pelo CallMeBot (grátis, só para o próprio número): mande "I allow callmebot to send me messages" para o robô deles
(callmebot.com › WhatsApp), receba a apikey e crie nas Propriedades do script (Configurações do projeto ⚙ › Propriedades
do script) `WHATS_DEV` = número com DDI, como o CallMeBot mostrou (ex.: 5534…), e `WHATS_CHAVE` = a apikey. Nunca no código.

Versão 36: o script confere o cargo antes de gravar cada alteração (cargo da liberação na aba Acessos + PERMISSOES do
Painel Dev). O que o cargo não pode fazer não é gravado: volta ao app em `recusadas` (o app v146 tira da fila e avisa) e fica
uma linha "Recusado: sem permissão" no Historico. `CARGOS_`/`FUNCOES_` são cópia do app: `tests/permissoes.cjs` confere no CI.
(A 35 foi o RDO por voz com o Gemini, desfeita.)

Versão 34: chat do Claude no Painel Dev (ação `devChat`, só o desenvolvedor, usa a mesma ANTHROPIC_API_KEY do RDO por voz)
e o tamanho de cada aba em `devDados`. No Extras.gs: vigia diário (rode `instalarVigia` uma vez e autorize o e-mail), que avisa
o desenvolvedor às 7h quando há erros, avisos em aberto, celulares com envios parados ou abas grandes.

Versão 33: Painel Dev do app. A ação `devDados` (só o desenvolvedor) devolve as últimas linhas das abas **Historico**
(quem gravou o quê e quando, para achar e desfazer lançamentos indevidos) e **Erros** (erros dos celulares).

Versão 32: sincronização mais rápida. A área pintada nova é gravada no fim da aba ConcretagemTracos (antes a aba
inteira era lida e regravada a cada envio e ficava mais lenta a cada pincelada), os traços de uma concretagem são lidos
só nas linhas dela e a observação da concretagem aceita até 2.000 caracteres.

Versão 31: a leitura do ticket por foto (versões 29 e 30) foi retirada por enquanto.

Versão 29: leitura do ticket da concreteira por foto (usa a propriedade ANTHROPIC_API_KEY, a mesma do RDO por voz),
abas **Erros** (erros de JavaScript dos celulares) e **Aparelhos** (versão do app e lançamentos sem enviar de cada celular),
criadas sozinhas na primeira vez, e resultados dos corpos de prova no painel (sem nomes).

Versão 28: o campo do PDF da concretagem (PDF_ID) aceita até 49.000 caracteres. Antes eram 300, e o mapa das
paredes (que vai nesse campo como "mapa:{...}") chegava cortado, dando "Não foi possível baixar o Mapa das paredes".

## Extras.gs (backup e senha do desenvolvedor)
1. No Apps Script, clique em **+ (Adicionar um arquivo) → Script**, dê o nome `Extras` e cole o conteúdo de `Extras.gs`.
2. Salve, escolha a função **instalarExtras** e clique em **Executar** (autorize quando o Google pedir).
3. Pronto: backup toda segunda às 3h na pasta "WIGO - Backups" do Drive (ficam as 8 últimas) e um menu
   **WIGO** na planilha com "Fazer backup agora" e "Esquecer a senha do desenvolvedor".

Não precisa publicar uma nova versão da implantação: os extras rodam na planilha, não no app.
