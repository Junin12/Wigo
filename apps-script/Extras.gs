/**
 * WIGO · extras do script da planilha (cole como um arquivo novo no Apps Script, ao lado do Code.gs).
 *
 * 1. Backup semanal: toda segunda de madrugada, uma cópia da planilha vai para a pasta "WIGO - Backups" no seu Drive.
 *    Ficam as 8 cópias mais recentes; as mais antigas vão para a lixeira.
 * 2. Menu "WIGO" na planilha:
 *    - Fazer backup agora
 *    - Esquecer a senha do desenvolvedor (o app pede para criar uma nova na próxima entrada como Desenvolvedor)
 *
 * Instalação (uma vez): escolha a função instalarExtras na barra do Apps Script e clique em Executar.
 * Não mexe no Code.gs nem nos dados: usa gatilhos próprios, então não conflita com um onOpen que já exista.
 */

const WIGO_PASTA_BACKUP = "WIGO - Backups";
// mensagem na planilha; rodando pelo editor do Apps Script (sem planilha aberta) vai para o Registro de execução
function wigoAviso_(txt) { try { SpreadsheetApp.getUi().alert("WIGO", txt, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { Logger.log(txt); } }
const WIGO_BACKUPS_GUARDADOS = 8;

function instalarExtras() {
  const ss = SpreadsheetApp.getActive();
  // apaga gatilhos antigos destas funções (rodar de novo não duplica)
  ScriptApp.getProjectTriggers()
    .filter(t => ["wigoBackupSemanal", "wigoMenu"].includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("wigoBackupSemanal").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).create();
  ScriptApp.newTrigger("wigoMenu").forSpreadsheet(ss).onOpen().create();
  try { wigoMenu(); } catch (e) { /* pelo editor não há planilha aberta: o menu aparece ao abrir a planilha */ }
  const nome = wigoBackupSemanal();
  wigoAviso_("Pronto: backup toda segunda às 3h (pasta \"" + WIGO_PASTA_BACKUP + "\" no Drive) e menu WIGO na planilha (recarregue a planilha para ver). Primeiro backup feito: \"" + nome + "\".");
}

function wigoMenu() {
  SpreadsheetApp.getUi().createMenu("WIGO")
    .addItem("Fazer backup agora", "wigoBackupAgora")
    .addSeparator()
    .addItem("Esquecer a senha do desenvolvedor", "wigoEsquecerSenhaDev")
    .addToUi();
}

function wigoPastaBackup_() {
  const it = DriveApp.getFoldersByName(WIGO_PASTA_BACKUP);
  return it.hasNext() ? it.next() : DriveApp.createFolder(WIGO_PASTA_BACKUP);
}

function wigoBackupSemanal() {
  const ss = SpreadsheetApp.getActive(), pasta = wigoPastaBackup_();
  const nome = ss.getName() + " · backup " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH'h'mm");
  DriveApp.getFileById(ss.getId()).makeCopy(nome, pasta);
  // guarda só as mais recentes
  const arqs = [];
  const it = pasta.getFiles();
  while (it.hasNext()) arqs.push(it.next());
  arqs.sort((a, b) => b.getDateCreated() - a.getDateCreated())
    .slice(WIGO_BACKUPS_GUARDADOS)
    .forEach(f => f.setTrashed(true));
  return nome;
}

function wigoBackupAgora() {
  const nome = wigoBackupSemanal();
  wigoAviso_("Backup feito: \"" + nome + "\" na pasta \"" + WIGO_PASTA_BACKUP + "\" do Drive.");
}

function wigoEsquecerSenhaDev() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert("Esquecer a senha do desenvolvedor",
    "A senha atual deixa de valer. Na próxima vez que alguém entrar no app como Desenvolvedor (com a palavra combinada), o app pede para criar uma senha nova. Faça isso logo em seguida.\n\nA senha do app (TOKEN), usada pelos celulares para sincronizar, NÃO é alterada.\n\nContinuar?",
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  PropertiesService.getScriptProperties().deleteProperty("DEV_SENHA");
  ui.alert("WIGO", "Senha do desenvolvedor apagada. Entre no app como Desenvolvedor e crie a nova.", ui.ButtonSet.OK);
}
