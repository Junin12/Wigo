# Script da planilha (Google Apps Script)

O app grava e lê os dados por um script ligado à planilha do Google (Extensões → Apps Script).

## Code.gs
Cópia do script publicado no Apps Script (sem senhas: a senha do app, TOKEN, e a do desenvolvedor, DEV_SENHA,
ficam nas Propriedades do script). Quando mudar o script aqui, cole no Apps Script e publique:
**Implantar → Gerenciar implantações → lápis ✏️ → Versão: Nova versão → Implantar** (o endereço /exec não muda).

Versão 30: o ticket é lido pelo Claude Haiku 5.5 (cerca de US$ 0,0005 por foto).

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
