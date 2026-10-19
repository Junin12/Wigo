# Script da planilha (Google Apps Script)

O app grava e lê os dados por um script ligado à planilha do Google (Extensões → Apps Script).

## Code.gs
O `Code.gs` publicado no Apps Script ainda não está guardado aqui. Para ter cópia e histórico dele:
copie todo o conteúdo do `Code.gs` do Apps Script e salve neste repositório como `apps-script/Code.gs`.
Ele **não** tem senhas escritas: a senha do app (TOKEN) e a do desenvolvedor (DEV_SENHA) ficam nas
Propriedades do script, fora do código.

## Extras.gs (backup e senha do desenvolvedor)
1. No Apps Script, clique em **+ (Adicionar um arquivo) → Script**, dê o nome `Extras` e cole o conteúdo de `Extras.gs`.
2. Salve, escolha a função **instalarExtras** e clique em **Executar** (autorize quando o Google pedir).
3. Pronto: backup toda segunda às 3h na pasta "WIGO - Backups" do Drive (ficam as 8 últimas) e um menu
   **WIGO** na planilha com "Fazer backup agora" e "Esquecer a senha do desenvolvedor".

Não precisa publicar uma nova versão da implantação: os extras rodam na planilha, não no app.
