# Script da planilha (Google Apps Script)

O app grava e lê os dados por um script ligado à planilha do Google (Extensões → Apps Script).

## Code.gs
Cópia do script publicado no Apps Script (sem senhas: a senha do app, TOKEN, e a do desenvolvedor, DEV_SENHA,
ficam nas Propriedades do script). Quando mudar o script aqui, cole no Apps Script e publique:
**Implantar → Gerenciar implantações → lápis ✏️ → Versão: Nova versão → Implantar** (o endereço /exec não muda).

Versão 35: o RDO por voz também funciona com o **Gemini gratuito** (Google AI Studio). Crie a propriedade
`GEMINI_API_KEY`; com ela o RDO usa o Gemini, sem ela usa o Claude (`ANTHROPIC_API_KEY`), e sem nenhuma o app organiza
sozinho. O modelo é o "Flash" mais novo que a chave enxerga; para fixar um, crie `GEMINI_MODELO`.

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
