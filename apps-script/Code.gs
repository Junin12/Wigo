/**
 * Armação SAA Rio Grande — banco de dados na planilha do Google Drive.
 *
 * Abas (criadas/atualizadas por configurar()):
 *   Itens        — base de posições de aço (1 linha por posição)
 *   Semanas      — semanas, armadores e dias trabalhados
 *   Lancamentos  — barras executadas: 1 linha por semana + código + equipe
 *   Equipes      — equipes de armação e quantidade de armadores
 *   Registros    — observações e fotos por posição, e ocorrências da semana
 *   Elementos    — frentes de serviço: concreto magro pronto, aço entregue e liberação para concretagem
 *   Config       — meta de produtividade (kg/armador/dia), dias por semana e prazo
 *   Efetivo      — quadro da obra: empresa + função (próprio e terceirizado)
 *   EfetivoDia   — efetivo diário: 1 linha por dia + função (turma, faltas, atestado, folga, empreiteiros, total)
 *   Pessoas      — nomes (opcional) ligados a uma função do quadro
 *   Presencas    — chegada por nome: 1 linha por dia + pessoa (P = chegou, com a hora; F, AT, FO); sem linha = não chegou
 *   Atividades   — produção: atividade, local, status, % feito, equipe de cada dia e histórico de alterações
 *   Historico    — rastreabilidade: cada alteração gravada com data/hora, nome e cargo de quem fez
 *   RDO          — diário de obra: 1 linha por dia (clima, equipamentos, ocorrências… em JSON), rascunho ou fechado
 *   Concretagens — concretagem de cada elemento: PDF da forma, volume previsto, caminhões (JSON) e situação
 *   ConcretagemTracos — áreas pintadas no PDF da forma: 1 linha por traço (caminhão, folha, pontos em coordenadas do PDF)
 *   Registros2   — módulos novos (equipamentos, segurança, qualidade, medições, obra, suprimentos, forma, escavação):
 *                  1 linha por registro; MODULO + TIPO dizem o que é e DADOS (JSON) guarda os campos
 *   Acessos      — 1 linha por celular: quem pediu (nome e cargo) e se o desenvolvedor liberou ou recusou
 *
 * Pastas ao lado da planilha: "Projetos" (PDFs da armação), "Formas" (PDFs da forma) e "Fotos" (fotos tiradas no app).
 *
 * Instalação: veja LEIA-ME.md. Resumo:
 *   1. Rode a função configurar() e copie a senha do registro.
 *   2. Implantar > Nova implantação > App da Web
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *      (ao atualizar o código: Gerenciar implantações > lápis > Nova versão)
 *   3. Cole a URL /exec e a senha no app.
 */

const ABAS = {
  Itens: ['CODIGO', 'EMPREENDIMENTO', 'ESTRUTURA', 'ITEM', 'PRANCHA', 'TIPO', 'POSICAO', 'BITOLA', 'LOCAL',
          'QTD_PREVISTA', 'COMP_UNIT_M', 'PESO_PREVISTO_KG', 'PEDIDO'],
  Semanas: ['SEMANA', 'INICIO', 'FIM', 'PERIODO', 'ARMADORES', 'DIAS'],
  Lancamentos: ['SEMANA', 'CODIGO', 'QTD', 'PESO_KG', 'ESTRUTURA', 'ATUALIZADO_EM', 'EQUIPE'],
  Equipes: ['EQUIPE', 'ARMADORES', 'ATIVA', 'ENCARREGADO', 'FRENTES'],
  Registros: ['ID', 'DATA', 'SEMANA', 'EQUIPE', 'TIPO', 'CODIGO', 'CATEGORIA', 'HORAS_PERDIDAS', 'TEXTO', 'FOTO_URL', 'CRIADO_EM'],
  // Elemento = estrutura + local (ex.: DECANTADORES · LAJE DE FUNDO): liberação para armar e para concretar
  Elementos: ['CHAVE', 'EMPREENDIMENTO', 'ESTRUTURA', 'LOCAL', 'CONCRETO_MAGRO', 'ACO_ENTREGUE', 'CHECKLIST', 'RESPONSAVEL',
              'LIBERADO_CONCRETAGEM', 'OBS', 'ATUALIZADO_EM', 'LANCES'],
  Config: ['CHAVE', 'VALOR'],
  Efetivo: ['ID', 'EMPRESA', 'FUNCAO', 'VINCULO', 'QUADRO', 'ORDEM', 'ATIVO', 'ATUALIZADO_EM'],
  EfetivoDia: ['DATA', 'ID', 'EMPRESA', 'FUNCAO', 'VINCULO', 'TURMA', 'FALTAS', 'ATESTADO', 'FOLGA', 'EMPREITEIROS', 'TOTAL', 'ATUALIZADO_EM'],
  Pessoas: ['ID', 'NOME', 'FUNCAO_ID', 'MATRICULA', 'ATIVO', 'OBS', 'ATUALIZADO_EM'],
  Presencas: ['DATA', 'ID', 'NOME', 'SITUACAO', 'HORA', 'ATUALIZADO_EM', 'POR'],
  // EQUIPES = {"2026-10-01": [id da pessoa, ...]}; HISTORICO = [{id, em, por, txt}] (últimas 80 alterações)
  Atividades: ['ID', 'ATIVIDADE', 'ESTRUTURA', 'LOCAL', 'STATUS', 'PROGRESSO', 'EQUIPES', 'OBS', 'CRIADO_EM', 'CRIADO_POR',
               'ATUALIZADO_EM', 'ATUALIZADO_POR', 'HISTORICO'],
  Historico: ['DATA_HORA', 'USUARIO', 'CARGO', 'ACAO', 'DETALHE'],
  // DADOS = JSON com clima, horário, equipamentos, ocorrências, visitas, fotos e, ao fechar, a foto do efetivo e das atividades
  RDO: ['DATA', 'STATUS', 'DADOS', 'CRIADO_POR', 'CRIADO_EM', 'ATUALIZADO_POR', 'ATUALIZADO_EM', 'FECHADO_POR', 'FECHADO_EM'],
  // CAMINHOES = [{n, cor, nf, usina, vol, chegada, inicio, fim, slump, fck, obs}]
  Concretagens: ['ID', 'DATA', 'ESTRUTURA', 'LOCAL', 'PDF_ID', 'PDF_NOME', 'STATUS', 'VOLUME_PREVISTO', 'CAMINHOES', 'OBS',
                 'CRIADO_POR', 'CRIADO_EM', 'ATUALIZADO_POR', 'ATUALIZADO_EM'],
  // PONTOS = "x1,y1,x2,y2,..." em pontos do PDF; LARGURA do pincel também em pontos do PDF
  ConcretagemTracos: ['ID', 'CONCRETAGEM', 'CAMINHAO', 'FOLHA', 'LARGURA', 'PONTOS', 'CRIADO_POR', 'CRIADO_EM'],
  // motor genérico dos módulos novos: DADOS = JSON com os campos do registro (o app define os campos de cada MODULO/TIPO)
  Registros2: ['ID', 'MODULO', 'DATA', 'TIPO', 'DADOS', 'STATUS', 'CRIADO_POR', 'CRIADO_EM', 'ATUALIZADO_POR', 'ATUALIZADO_EM'],
  // APARELHO = código aleatório criado no celular; STATUS = pendente, liberado ou recusado
  Acessos: ['APARELHO', 'NOME', 'CARGO', 'STATUS', 'PEDIDO_EM', 'DECIDIDO_POR', 'DECIDIDO_EM', 'MOTIVO'],
  // erros de JavaScript dos celulares (o app manda junto com a sincronização): para o desenvolvedor achar problemas
  Erros: ['DATA_HORA', 'APARELHO', 'USUARIO', 'VERSAO_APP', 'MENSAGEM', 'ONDE', 'NAVEGADOR'],
  // estado de cada celular na última sincronização: versão do app e lançamentos ainda não enviados
  Aparelhos: ['APARELHO', 'NOME', 'CARGO', 'VERSAO_APP', 'PENDENTES', 'PENDENTE_DESDE', 'ULTIMA_SINC'],
};
const DIAS_REG2 = 120; // registros dos módulos novos enviados ao app: os dos últimos dias e todos os ainda em aberto
const NOMES_REG2 = { equip: 'Equipamentos', seg: 'Segurança', qual: 'Qualidade', med: 'Medições', obras: 'Obras', sup: 'Suprimentos', forma: 'Forma', esc: 'Escavação', concreto: 'Concreto' };
const REG2_FECHADO =/^(fechad|conclu|resolvid|encerrad|cancelad|inativ)/i; // situações que, antigas, ficam só na planilha
const DIAS_CONCRETAGEM = 90; // concretagens concluídas há mais tempo que isso não vão mais para o app
const DIAS_RDO = 62; // RDOs enviados ao app (os mais antigos ficam só na planilha)
const DIAS_ATIVIDADES = 10; // atividades concluídas há mais tempo que isso não vão mais para o app
// Situação por nome no dia (quem não tem linha ainda não chegou e, no fechamento, conta como falta)
const SITUACOES = { P: 'CHEGOU', F: 'FALTA', AT: 'ATESTADO', FO: 'FOLGA' };
const DIAS_EFETIVO = 45; // dias de efetivo enviados ao app (o histórico inteiro fica na planilha)
// total do dia = 1ª turma − faltas − atestado − folga + empreiteiros
// (o "_" no fim esconde a função do menu Executar do Apps Script: ela só é chamada pelo próprio script)
function totalDia_(v) { v = v || []; return Math.max(0, (v[0] || 0) - (v[1] || 0) - (v[2] || 0) - (v[3] || 0) + (v[4] || 0)); }

// ---------- instalação ----------
function configurar() {
  const ss = SpreadsheetApp.getActive();
  for (const [nome, cab] of Object.entries(ABAS)) {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold'); // colunas novas entram no fim
    sh.setFrozenRows(1);
  }
  // primeira equipe e lançamentos antigos sem equipe
  if (!linhas('Equipes').length) aba('Equipes').getRange(2, 1, 1, 5).setValues([['Equipe 1', 3, 'SIM', '', '']]);
  if (!linhas('Config').length) regravar(aba('Config'), 2, [['META_KG_ARM_DIA', '200'], ['DIAS_SEMANA', '6'], ['PRAZO', '']]);
  repararCodigos();
  const eq = equipePadrao();
  const L = linhas('Lancamentos');
  if (L.some(r => r[0] !== '' && !r[6])) regravar(aba('Lancamentos'), ABAS.Lancamentos.length, L.map(r => (r[0] !== '' && !r[6]) ? r.slice(0, 6).concat([eq]) : r));

  const props = PropertiesService.getScriptProperties();
  let senha = props.getProperty('TOKEN');
  if (!senha) {
    senha = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty('TOKEN', senha);
  }
  Logger.log('SENHA DO APP: ' + senha);
  Logger.log('CHAVE DE LEITURA (painel e Power BI, só lê): ' + chaveLeitura());
  Logger.log('SENHA DO DESENVOLVEDOR: ' + (props.getProperty('DEV_SENHA') ? 'criada.' : 'ainda não criada. Entre no app como Desenvolvedor para criar.'));
  Logger.log('PASTA DOS PROJETOS (coloque os PDFs aqui): ' + pasta('Projetos').getUrl());
  Logger.log('PASTA DAS FOTOS: ' + pasta('Fotos').getUrl());
  Logger.log('PASTA DAS FORMAS (projeto e catálogo da forma, separados da armação): ' + pasta('Formas').getUrl());
  Logger.log('RDO POR VOZ (IA): ' + (props.getProperty('ANTHROPIC_API_KEY')
    ? 'chave da API do Claude configurada.'
    : 'sem chave. Para o app organizar o RDO ditado com IA, crie a propriedade ANTHROPIC_API_KEY (veja o LEIA-ME).'));
  return senha;
}

// Diagnóstico: no editor, escolha "diagnostico" ao lado de Executar, clique em Executar e veja o Registro de execução.
// Mostra quanto tempo cada aba leva para ser lida e o erro real, se houver (o app só vê a página genérica do Google).
function diagnostico() {
  const t0 = Date.now();
  const medir = (rot, fn) => {
    const t = Date.now();
    try { const r = fn(); Logger.log(rot + ': ' + (Date.now() - t) + ' ms' + (r && r.length != null ? ' · ' + r.length + ' itens' : '')); return r; }
    catch (e) { Logger.log(rot + ': ERRO depois de ' + (Date.now() - t) + ' ms → ' + (e && e.message || e)); return null; }
  };
  Logger.log('Code.gs versão ' + VERSAO_SCRIPT);
  Object.keys(ABAS).forEach(n => medir('aba ' + n, () => { const sh = aba(n); Logger.log('  ' + n + ': ' + sh.getLastRow() + ' linhas × ' + sh.getLastColumn() + ' colunas'); return linhas(n); }));
  medir('RDO enviados ao app', () => Object.keys(lerRdos()));
  medir('Concretagens enviadas', lerConcretagens);
  medir('Registros2 enviados', lerRegistros2);
  const d = medir('carregar (tudo que vai para o app)', () => [carregar('')]);
  if (d && d[0]) {
    const txt = JSON.stringify(d[0]);
    Logger.log('Tamanho da resposta: ' + Math.round(txt.length / 1024) + ' KB; comprimida: '
      + Math.round(Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(txt, 'application/json')).getBytes()).length / 1024) + ' KB');
    Object.keys(d[0]).forEach(k => Logger.log('  ' + k + ': ' + Math.round(JSON.stringify(d[0][k]).length / 1024) + ' KB'));
  }
  Logger.log('TOTAL: ' + Math.round((Date.now() - t0) / 1000) + ' s');
}

// Pastas ao lado da planilha; criadas na primeira vez.
function pasta(nome) {
  const props = PropertiesService.getScriptProperties(), chave = 'PASTA_' + nome.toUpperCase();
  const id = props.getProperty(chave);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* apagada: recria */ } }
  const mae = DriveApp.getFileById(SpreadsheetApp.getActive().getId()).getParents();
  const base = mae.hasNext() ? mae.next() : DriveApp.getRootFolder();
  const existentes = base.getFoldersByName(nome);
  const p = existentes.hasNext() ? existentes.next() : base.createFolder(nome);
  props.setProperty(chave, p.getId());
  return p;
}

// Chave só de leitura: painel HTML e Power BI. Não grava nada; é diferente da senha do app.
function chaveLeitura() {
  const props = PropertiesService.getScriptProperties();
  let k = props.getProperty('LEITURA');
  if (!k) { k = Utilities.getUuid().replace(/-/g, '').slice(0, 20); props.setProperty('LEITURA', k); }
  return k;
}

// ---------- acesso: cada celular pede liberação ao desenvolvedor ----------
// O pedido vale para aquele celular com aquele nome e cargo; mudar o nome ou o cargo faz um pedido novo.
// A senha do desenvolvedor é criada uma única vez, no app (aqui fica só o resumo dela). Esqueceu? Rode zerarSenhaDev().
const MSG_RECUSA = 'Você precisa entrar na sua função específica na obra.';
const TXT_ACESSO = { pendente: 'Aguardando liberação do desenvolvedor.', novo: 'Este celular ainda não pediu acesso.' };

function zerarSenhaDev() {
  PropertiesService.getScriptProperties().deleteProperty('DEV_SENHA');
  Logger.log('Senha do desenvolvedor apagada. Entre no app como Desenvolvedor para criar outra.');
}
function resumoSenha_(s) {
  const props = PropertiesService.getScriptProperties();
  let sal = props.getProperty('DEV_SAL');
  if (!sal) { sal = Utilities.getUuid(); props.setProperty('DEV_SAL', sal); }
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + '|' + s, Utilities.Charset.UTF_8));
}
function comLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
const acessoDe_ = ap => { ap = String(ap || ''); return ap ? linhas('Acessos').find(r => String(r[0]) === ap) || null : null; };
const statusAcesso_ = r => r ? { status: String(r[3]), nome: String(r[1]), cargo: String(r[2]), motivo: String(r[7] || '') } : { status: 'novo' };
const ehDevLiberado_ = r => !!r && String(r[2]) === 'Desenvolvedor' && String(r[3]) === 'liberado';
function gravarAcesso_(linha) {
  const L = linhas('Acessos'), k = L.findIndex(r => String(r[0]) === String(linha[0]));
  if (k >= 0) L[k] = linha; else L.push(linha);
  regravar(aba('Acessos'), ABAS.Acessos.length, L);
}
function logAcesso_(nome, cargo, acao, det) {
  const sh = aba('Historico'), ini = sh.getLastRow() + 1;
  sh.getRange(ini, 2, 1, 4).setNumberFormat('@');
  sh.getRange(ini, 1, 1, 5).setValues([[new Date(), nome || 'sem login', cargo || '', acao, String(det || '').slice(0, 500)]]);
}
const quemPede_ = corpo => {
  const u = corpo.usuario || {};
  return { ap: String(corpo.aparelho || '').slice(0, 64), nome: String(u.nome || '').trim().slice(0, 80), cargo: String(u.cargo || '').trim().slice(0, 60) };
};
// pedido de acesso (ou só consulta, se o pedido já existe)
function pedirAcesso_(corpo) {
  const q = quemPede_(corpo);
  if (!q.ap || q.nome.length < 3 || !q.cargo) throw new Error('Pedido de acesso incompleto.');
  if (q.cargo === 'Desenvolvedor') throw new Error('Para entrar como Desenvolvedor, use a senha.');
  const r = acessoDe_(q.ap);
  const mesmo = r && String(r[1]) === q.nome && String(r[2]) === q.cargo;
  if (mesmo && (String(r[3]) !== 'recusado' || !corpo.pedirDeNovo)) return { acesso: statusAcesso_(r) };
  const nova = [q.ap, q.nome, q.cargo, 'pendente', new Date(), '', '', ''];
  gravarAcesso_(nova);
  logAcesso_(q.nome, q.cargo, 'Pedido de acesso', q.cargo);
  return { acesso: statusAcesso_(nova) };
}
// entrada do desenvolvedor: cria a senha na primeira vez; depois, só entra com ela
function entrarDev_(corpo) {
  const q = quemPede_(corpo), senha = String(corpo.senha || ''), props = PropertiesService.getScriptProperties();
  if (!q.ap || q.nome.length < 3) throw new Error('Pedido de acesso incompleto.');
  const cache = CacheService.getScriptCache(), erros = Number(cache.get('DEV_ERROS') || 0);
  if (erros >= 5) throw new Error('Muitas tentativas erradas. Espere 15 minutos.');
  const atual = props.getProperty('DEV_SENHA');
  if (!atual) {
    if (!corpo.criar) return { acesso: { status: 'semSenha' } };
    if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    props.setProperty('DEV_SENHA', resumoSenha_(senha));
    logAcesso_(q.nome, 'Desenvolvedor', 'Senha do desenvolvedor criada', '');
  } else if (corpo.criar) {
    throw new Error('A senha do desenvolvedor já foi criada.');
  } else if (resumoSenha_(senha) !== atual) {
    cache.put('DEV_ERROS', String(erros + 1), 900);
    logAcesso_(q.nome, 'Desenvolvedor', 'Senha do desenvolvedor errada', '');
    throw new Error('Senha incorreta.');
  }
  const agora = new Date(), linha = [q.ap, q.nome, 'Desenvolvedor', 'liberado', agora, q.nome, agora, ''];
  gravarAcesso_(linha);
  logAcesso_(q.nome, 'Desenvolvedor', 'Entrada do desenvolvedor', '');
  return { acesso: statusAcesso_(linha), acessos: listaAcessos_() };
}
// celular liberado? Se não, o erro leva a situação (o app mostra a tela de espera ou de recusa)
function conferirAcesso_(corpo) {
  const r = acessoDe_(corpo.aparelho);
  if (r && String(r[3]) === 'liberado') return r;
  const st = statusAcesso_(r), err = new Error(st.status === 'recusado' ? (st.motivo || MSG_RECUSA) : (TXT_ACESSO[st.status] || TXT_ACESSO.novo));
  err.acesso = st;
  throw err;
}
// últimas linhas de uma aba (as mais novas primeiro), para o Painel Dev
function ultimasLinhas_(nome, n) {
  const sh = abaOuCria_(nome), tot = sh.getLastRow() - 1;
  if (tot < 1) return [];
  const q = Math.min(n, tot);
  return sh.getRange(sh.getLastRow() - q + 1, 1, q, sh.getLastColumn()).getValues().reverse();
}
function devDados_(corpo) {
  const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
  const n = Math.max(50, Math.min(Number(corpo.n) || 800, 3000));
  return {
    historico: ultimasLinhas_('Historico', n).map(r => ({ em: iso(r[0]), usuario: String(r[1] || ''), cargo: String(r[2] || ''), acao: String(r[3] || ''), det: String(r[4] || '') })),
    abas: SpreadsheetApp.getActive().getSheets().map(sh => ({ nome: sh.getName(), linhas: sh.getLastRow(), colunas: sh.getLastColumn() })),
    erros: ultimasLinhas_('Erros', 300).map(r => ({ em: iso(r[0]), aparelho: String(r[1] || ''), usuario: String(r[2] || ''), versao: String(r[3] || ''), msg: String(r[4] || ''), onde: String(r[5] || '') })),
  };
}
// ---------- Chat do Claude no Painel Dev (só o desenvolvedor) ----------
// O app manda a conversa; aqui entram a chave (Propriedades do script: ANTHROPIC_API_KEY), o modelo, as instruções
// e a lista de ferramentas (fixas aqui, o app não escolhe). As ferramentas rodam no app: leitura direto,
// alteração só depois que o desenvolvedor confirma.
const DEV_CHAT_SISTEMA = 'Você é o assistente técnico do WIGO, app de gestão da obra SAA Rio Grande (Uberaba/MG), dentro do Painel Dev. '
  + 'Quem fala com você é o desenvolvedor do app. Ajude a achar e resolver problemas: funções com erro, avisos dos usuários, '
  + 'lançamentos indevidos, permissões de cargos e celulares com dados presos.\n'
  + 'Use as ferramentas para olhar os dados reais antes de concluir qualquer coisa; nunca invente números, nomes ou ids. '
  + 'Ferramentas de alteração (mudar_permissao, marcar_resolvido, apagar_registro, voltar_lancamento_aco, correcao) só rodam '
  + 'depois que o desenvolvedor confirma no app: explique antes, em uma frase, o que vai fazer e por quê. '
  + 'Você não altera o código do app. Quando a solução exigir mudar o código, diga o que mudar e onde (função, tela) e '
  + 'sugira gerar o pacote (gerar_pacote) para o desenvolvedor levar ao Claude Code no computador.\n'
  + 'Escreva em português do Brasil, frases curtas, sem jargão. Termine dizendo o que foi feito e o que falta.';
const s_ = (d) => ({ type: 'string', description: d });
const ferr_ = (name, description, props) => ({ name: name, description: description, strict: true,
  input_schema: { type: 'object', additionalProperties: false, required: Object.keys(props), properties: props } });
const DEV_CHAT_FERRAMENTAS = [
  ferr_('rodar_diagnostico', 'Roda os testes internos do app neste celular (versões, sincronização, pendências, memória, permissões, cálculos, registros que quebram telas, erros).', {}),
  ferr_('ler_avisos', 'Lista os avisos em aberto: problemas relatados pelos usuários, lançamentos indevidos e erros automáticos dos celulares.', {}),
  ferr_('ler_permissoes', 'Mostra o nível (edit, ver, nao) de cada função para um cargo, e o padrão do código.', { cargo: s_('Cargo exato, ou "" para todos') }),
  ferr_('ler_historico', 'Lê o Histórico da planilha: cada alteração feita por qualquer celular, com nome, cargo e horário.',
    { pessoa: s_('Nome (ou começo do nome), ou ""'), dia: s_('AAAA-MM-DD, ou ""'), de: s_('HH:MM, ou ""'), ate: s_('HH:MM, ou ""'), limite: { type: 'integer', description: 'Máximo de linhas (até 150)' } }),
  ferr_('ler_aparelhos', 'Lista os celulares: pessoa, cargo, versão do app, última sincronização e lançamentos ainda não enviados.', {}),
  ferr_('mudar_permissao', 'Muda o nível de uma função para um cargo (precisa de confirmação).',
    { cargo: s_('Cargo exato'), funcao: s_('Id da função, como em ler_permissoes'), nivel: { type: 'string', enum: ['edit', 'ver', 'nao'] } }),
  ferr_('marcar_resolvido', 'Marca um aviso (problema, lançamento indevido ou erro) como resolvido (precisa de confirmação).', { id: s_('Id do aviso, como em ler_avisos') }),
  ferr_('apagar_registro', 'Apaga um registro de módulo (Qualidade, Segurança, Medições etc.); a cópia fica no registro de mudanças (precisa de confirmação).', { id: s_('Id do registro') }),
  ferr_('voltar_lancamento_aco', 'Grava a quantidade de barras de uma posição de aço numa semana e equipe (precisa de confirmação).',
    { semana: { type: 'integer' }, codigo: s_('Código da posição'), equipe: s_('Equipe exatamente como no Histórico'), barras: { type: 'number' } }),
  ferr_('correcao', 'Faz uma correção simples neste celular (precisa de confirmação).', { nome: { type: 'string', enum: ['sincronizar', 'recalcular', 'atualizar_app', 'limpar_erros'] } }),
  ferr_('gerar_pacote', 'Gera o pacote de texto (diagnóstico, mudanças, aparelhos, erros, permissões) para levar ao Claude Code.', {}),
];
function devChat_(corpo) {
  const chave = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!chave) throw new Error('Falta a chave ANTHROPIC_API_KEY nas Propriedades do script.');
  const msgs = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];
  if (!msgs.length) throw new Error('Conversa vazia.');
  if (JSON.stringify(msgs).length > 600000) throw new Error('Conversa longa demais: comece uma nova.');
  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
    payload: JSON.stringify({
      model: CLAUDE_MODELO, max_tokens: 8000,
      fallbacks: 'default', // se o modelo recusar, o servidor tenta outro sozinho
      output_config: { effort: 'medium' },
      cache_control: { type: 'ephemeral' }, // instruções e ferramentas fixas: reaproveitadas entre as mensagens
      system: DEV_CHAT_SISTEMA, tools: DEV_CHAT_FERRAMENTAS, tool_choice: { type: 'auto' },
      messages: msgs,
    }),
  });
  const cod = resp.getResponseCode();
  let j; try { j = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('Resposta inválida da IA (HTTP ' + cod + ').'); }
  if (cod !== 200) throw new Error('IA indisponível (HTTP ' + cod + '): ' + ((j.error && j.error.message) || '').slice(0, 300));
  return { content: j.content || [], stop_reason: j.stop_reason, modelo: j.model, uso: j.usage || {} };
}
function listaAcessos_() {
  const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
  const est = new Map(abaOuCria_('Aparelhos') && linhas('Aparelhos').map(r => [String(r[0]), r]));
  return linhas('Acessos').map(r => { const e = est.get(String(r[0])) || [];
    return { aparelho: String(r[0]), nome: String(r[1]), cargo: String(r[2]), status: String(r[3]),
      pedidoEm: iso(r[4]), decididoPor: String(r[5] || ''), decididoEm: iso(r[6]), motivo: String(r[7] || ''),
      versaoApp: String(e[3] || ''), pendentes: Number(e[4]) || 0, pendenteDesde: String(e[5] || ''), ultimaSinc: iso(e[6]) }; });
}
// abas criadas depois da instalação (Erros, Aparelhos): aparecem sozinhas na primeira vez, sem rodar configurar()
function abaOuCria_(nome) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(nome);
  if (!sh) { sh = ss.insertSheet(nome); sh.getRange(1, 1, 1, ABAS[nome].length).setValues([ABAS[nome]]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
// erros de JavaScript mandados pelo celular (no máximo 20 por vez, textos curtos)
function gravarErros_(eu, erros) {
  const sh = abaOuCria_('Erros'), agora = new Date();
  const L = erros.slice(0, 20).map(x => [x && x.em ? new Date(x.em) : agora, String(eu[0]), String(eu[1]) + ' (' + String(eu[2]) + ')',
    String(x && x.v || '').slice(0, 20), String(x && x.msg || '').slice(0, 500), String(x && x.onde || '').slice(0, 300), String(x && x.nav || '').slice(0, 200)]);
  const ini = sh.getLastRow() + 1;
  sh.getRange(ini, 2, L.length, 6).setNumberFormat('@');
  sh.getRange(ini, 1, L.length, 7).setValues(L);
}
// estado do celular: versão do app e fila de lançamentos ainda não enviados (1 linha por aparelho)
function gravarEstado_(eu, est) {
  const sh = abaOuCria_('Aparelhos'), ap = String(eu[0]), n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const k = ids.indexOf(ap), lin = k >= 0 ? k + 2 : sh.getLastRow() + 1;
  sh.getRange(lin, 1, 1, 7).setNumberFormat('@').setValues([[ap, String(eu[1]), String(eu[2]), String(est.versao || '').slice(0, 20),
    String(Math.max(0, Number(est.pend) || 0)), String(est.desde || '').slice(0, 30), new Date().toISOString()]]);
}
// liberar, recusar ou apagar um pedido (só o desenvolvedor)
function decidirAcesso_(corpo, dev) {
  const alvo = String(corpo.alvo || ''), st = String(corpo.status || '');
  if (!/^(liberado|recusado|apagar)$/.test(st)) throw new Error('Decisão inválida.');
  if (alvo === String(dev[0])) throw new Error('Você não pode mudar o acesso deste celular.');
  const L = linhas('Acessos'), k = L.findIndex(r => String(r[0]) === alvo);
  if (k < 0) throw new Error('Pedido não encontrado. Atualize a lista.');
  const r = L[k], txt = st === 'liberado' ? 'Acesso liberado' : st === 'recusado' ? 'Acesso recusado' : 'Pedido de acesso apagado';
  if (st === 'apagar') L.splice(k, 1);
  else { r[3] = st; r[5] = String(dev[1]); r[6] = new Date(); r[7] = st === 'recusado' ? (String(corpo.motivo || '').trim().slice(0, 200) || MSG_RECUSA) : ''; }
  regravar(aba('Acessos'), ABAS.Acessos.length, L);
  logAcesso_(String(dev[1]), 'Desenvolvedor', txt, r[1] + ' (' + r[2] + ')');
}

// ---------- entrada HTTP ----------
function doGet(e) {
  const gz = () => e.parameter.gz === '1'; // &gz=1: resposta comprimida (painel novo)
  // testes de entrega (não mostram dados): ?teste=espera&s=8 só espera; ?teste=planilha abre a planilha e lê a aba Config
  if (e.parameter.teste === 'espera') {
    const s = Math.min(20, Math.max(0, Number(e.parameter.s) || 0));
    Utilities.sleep(s * 1000);
    return json({ ok: true, teste: 'espera', segundos: s });
  }
  if (e.parameter.teste === 'planilha') {
    const t = Date.now(), n = linhas('Config').length;
    return json({ ok: true, teste: 'planilha', linhasConfig: n, ms: Date.now() - t });
  }
  // leitura pública (com chave de leitura): ?k=CHAVE  -> dados do painel
  //                                          ?k=CHAVE&tabela=lancamentos -> tabela para o Power BI
  if (e.parameter.k != null) {
    if (e.parameter.k !== chaveLeitura()) return json({ ok: false, erro: 'Chave de leitura inválida.' });
    if (e.parameter.tabela) return json(tabelaBI(String(e.parameter.tabela)));
    // nomes do pessoal não saem pela chave de leitura
    return responder(() => { const d = carregar(''); delete d.leitura; delete d.pessoas; delete d.presencas; delete d.presPor; delete d.atividades; delete d.rdo; delete d.concretagens; delete d.registros2; d.registros = d.registros.filter(r => r.tipo === 'ocorrencia'); d.forma = formaResumo_(d.config); d.concreto = concretoResumo_(); d.cps = cpsResumo_(); d.alterado = ultimaAlteracao_(); return d; }, gz);
  }
  return responder(() => {
    autenticar(e.parameter.token);
    conferirAcesso_({ aparelho: e.parameter.a }); // ?a=APARELHO (celular liberado)
    return carregar(e.parameter.v || '');
  }, gz);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let gz = false; // o app novo pede a resposta comprimida (corpo.gz)
  return responder(() => {
    const corpo = JSON.parse(e.postData.contents);
    gz = !!corpo.gz;
    autenticar(corpo.token);
    if (corpo.acao === 'acesso') return comLock_(() => pedirAcesso_(corpo));
    if (corpo.acao === 'dev') return comLock_(() => entrarDev_(corpo));
    // daqui para baixo, só celular liberado; o nome e o cargo gravados no histórico são os liberados
    const eu = conferirAcesso_(corpo), dev = ehDevLiberado_(eu);
    const usuario = { nome: String(eu[1]), cargo: String(eu[2]) };
    // erros e estado do celular vêm junto com qualquer pedido; uma falha aqui não atrapalha o resto
    try { if (Array.isArray(corpo.erros) && corpo.erros.length) gravarErros_(eu, corpo.erros); } catch (e) { /* segue */ }
    try { if (corpo.estado) gravarEstado_(eu, corpo.estado); } catch (e) { /* segue */ }
    if (corpo.acao === 'acessos' || corpo.acao === 'acessoDecidir') {
      if (!dev) throw new Error('Só o desenvolvedor libera acessos.');
      if (corpo.acao === 'acessoDecidir') comLock_(() => decidirAcesso_(corpo, eu));
      return { acessos: listaAcessos_() };
    }
    // Painel Dev do app: Histórico (quem gravou o quê e quando) e erros dos celulares, só para o desenvolvedor
    if (corpo.acao === 'devDados') {
      if (!dev) throw new Error('Só o desenvolvedor vê o Histórico.');
      return devDados_(corpo);
    }
    if (corpo.acao === 'devChat') {
      if (!dev) throw new Error('Só o desenvolvedor usa o chat do Painel Dev.');
      return devChat_(corpo);
    }
    if (corpo.acao === 'projetos') return listarProjetos(String(corpo.pasta || 'Projetos'));
    if (corpo.acao === 'pdf') return lerPdf(String(corpo.id || ''), corpo.parte, corpo.ini, corpo.tam);
    if (corpo.acao === 'miniatura') return miniatura(String(corpo.url || ''));
    if (corpo.acao === 'rdoVoz') return organizarRdo(corpo);
    if (corpo.acao === 'ccTracos') return { tracos: lerTracos(String(corpo.conc || '')) };
    comLock_(() => aplicar(corpo.ops || [], usuario));
    const out = carregar(corpo.v || '');
    out.acesso = statusAcesso_(eu);
    if (dev) out.acessos = listaAcessos_();
    return out;
  }, () => gz);
}

// O Google não entrega respostas grandes (devolve a página "Drive: Não foi possível abrir o arquivo").
// Por isso, quando o app ou o painel pedem (gz), a resposta grande vai comprimida (gzip em base64): fica ~8x menor.
const GZ_MIN = 20000;
function responder(fn, querGz) {
  let saida;
  try { saida = Object.assign({ ok: true }, fn()); }
  catch (err) { saida = { ok: false, erro: String(err && err.message || err) }; if (err && err.acesso) saida.acesso = err.acesso; }
  let txt = JSON.stringify(saida);
  if (querGz && querGz() && txt.length > GZ_MIN)
    txt = JSON.stringify({ ok: saida.ok, gz: Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(txt, 'application/json')).getBytes()) });
  return ContentService.createTextOutput(txt).setMimeType(ContentService.MimeType.JSON);
}

function autenticar(token) {
  const senha = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!senha) throw new Error('A planilha ainda não foi configurada. Rode a função configurar() no Apps Script.');
  if (token !== senha) throw new Error('Senha do app incorreta.');
}

// Miniatura de uma foto da pasta Fotos (para o relatório em PDF)
function miniatura(url) {
  const m = url.match(/[-\w]{25,}/);
  if (!m) throw new Error('Foto não encontrada.');
  const f = DriveApp.getFileById(m[0]);
  let dentro = false;
  for (const p = f.getParents(); p.hasNext();) if (p.next().getId() === pasta('Fotos').getId()) { dentro = true; break; }
  if (!dentro) throw new Error('Arquivo fora da pasta Fotos.');
  const b = f.getSize() < 1500000 ? f.getBlob() : (f.getThumbnail() || f.getBlob());
  return { b64: Utilities.base64Encode(b.getBytes()), tipo: b.getContentType() };
}

// ---------- RDO por voz: o relato ditado vira campos do RDO (API do Claude) ----------
// A chave fica só aqui no Google (Propriedades do script: ANTHROPIC_API_KEY), nunca no app.
// Sem a chave, o app usa uma organização simples feita no próprio celular.
const CLAUDE_MODELO = 'claude-opus-5-5';
const RDO_VOZ_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['clima', 'condicao', 'inicio', 'fim', 'atividades', 'outrosServicos', 'equipamentos', 'ocorrencias', 'visitas'],
  properties: {
    clima: { type: 'object', additionalProperties: false, required: ['manha', 'tarde', 'noite'], properties: {
      manha: { type: 'string', enum: ['', 'Bom', 'Nublado', 'Chuva', 'Impraticável'] },
      tarde: { type: 'string', enum: ['', 'Bom', 'Nublado', 'Chuva', 'Impraticável'] },
      noite: { type: 'string', enum: ['', 'Bom', 'Nublado', 'Chuva', 'Impraticável'] } } },
    condicao: { type: 'string', enum: ['', 'Praticável', 'Impraticável'] },
    inicio: { type: 'string', description: 'Início do expediente HH:MM, ou "" se não foi dito' },
    fim: { type: 'string', description: 'Fim do expediente HH:MM, ou "" se não foi dito' },
    atividades: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'observacao'], properties: {
      id: { type: 'string', description: 'id de uma atividade da lista do dia' },
      observacao: { type: 'string', description: 'o que foi dito sobre essa atividade, em uma frase' } } } },
    outrosServicos: { type: 'array', items: { type: 'string' }, description: 'serviços ditos que não correspondem a nenhuma atividade da lista' },
    equipamentos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nome', 'quantidade', 'horas'], properties: {
      nome: { type: 'string' }, quantidade: { type: 'integer' }, horas: { type: 'number', description: '0 se não foi dito' } } } },
    ocorrencias: { type: 'array', items: { type: 'string' } },
    visitas: { type: 'array', items: { type: 'string' } },
  },
};
// ---------- Gemini (Google AI Studio, plano gratuito) para o RDO por voz ----------
// Chave nas Propriedades do script: GEMINI_API_KEY. O modelo é escolhido sozinho (o "Flash" mais novo que a chave
// enxerga, guardado por 6 horas); para fixar um, crie a propriedade GEMINI_MODELO (ex.: gemini-2.5-flash).
function geminiModelo_(chave) {
  const fixo = PropertiesService.getScriptProperties().getProperty('GEMINI_MODELO');
  if (fixo) return fixo;
  const cache = CacheService.getScriptCache(), guardado = cache.get('GEMINI_MODELO');
  if (guardado) return guardado;
  const r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': chave }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('A chave do Gemini foi recusada (HTTP ' + r.getResponseCode() + '). Confira GEMINI_API_KEY.');
  const todos = (JSON.parse(r.getContentText()).models || []).filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0 && /flash/.test(m.name)
    && !/image|tts|audio|live|embedding|thinking/.test(m.name));
  const estaveis = todos.filter(m => !/lite|exp|preview/.test(m.name));
  const lista = estaveis.length ? estaveis : todos;
  if (!lista.length) throw new Error('Nenhum modelo Flash disponível para esta chave do Gemini.');
  const versao = n => Number((String(n).match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]);
  lista.sort((a, b) => versao(b.name) - versao(a.name) || a.name.length - b.name.length);
  const nome = lista[0].name.replace(/^models\//, '');
  cache.put('GEMINI_MODELO', nome, 21600);
  return nome;
}
// JSON Schema (como o do Claude) → formato de esquema do Gemini (tipos em maiúsculas, sem additionalProperties)
function paraGemini_(s) {
  const o = {};
  if (s.type) o.type = String(s.type).toUpperCase();
  if (s.description) o.description = s.description;
  if (s.enum) o.enum = s.enum;
  if (s.required) o.required = s.required;
  if (s.properties) { o.properties = {}; Object.keys(s.properties).forEach(k => { o.properties[k] = paraGemini_(s.properties[k]); }); o.propertyOrdering = Object.keys(s.properties); }
  if (s.items) o.items = paraGemini_(s.items);
  return o;
}
// pede ao Gemini um JSON no formato do esquema; se o esquema for recusado (HTTP 400), tenta de novo com o esquema no texto
function geminiJson_(chave, sistema, usuario, esquema) {
  const modelo = geminiModelo_(chave);
  const pedir = comEsquema => UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelo + ':generateContent', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-goog-api-key': chave },
    payload: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: 'user', parts: [{ text: usuario + (comEsquema ? '' : '\n\nResponda só com um JSON neste formato (JSON Schema):\n' + JSON.stringify(esquema)) }] }],
      generationConfig: Object.assign({ responseMimeType: 'application/json', temperature: 0.2 }, comEsquema ? { responseSchema: paraGemini_(esquema) } : {}),
    }),
  });
  let resp = pedir(true);
  if (resp.getResponseCode() === 400) resp = pedir(false);
  const cod = resp.getResponseCode();
  let j; try { j = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('Resposta inválida do Gemini (HTTP ' + cod + ').'); }
  if (cod === 429) throw new Error('Limite gratuito do Gemini atingido por agora: tente de novo em alguns minutos.');
  if (cod !== 200) throw new Error('Gemini indisponível (HTTP ' + cod + '): ' + ((j.error && j.error.message) || '').slice(0, 200));
  const c = (j.candidates || [])[0];
  if (!c || !c.content) throw new Error('O Gemini não organizou este relato (' + ((c && c.finishReason) || (j.promptFeedback && j.promptFeedback.blockReason) || 'sem resposta') + '). Preencha manualmente.');
  const txt = (c.content.parts || []).map(p => p.text || '').join('').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  try { return { json: JSON.parse(txt), modelo: modelo }; } catch (e) { throw new Error('O Gemini devolveu um texto que não é JSON. Tente de novo.'); }
}
function organizarRdo(corpo) {
  const props = PropertiesService.getScriptProperties();
  const chave = props.getProperty('ANTHROPIC_API_KEY'), gemini = props.getProperty('GEMINI_API_KEY');
  if (!chave && !gemini) return { semChave: true };
  const texto = String(corpo.texto || '').trim().slice(0, 12000);
  if (!texto) throw new Error('Nada foi ditado.');
  const ctx = corpo.contexto || {};
  const lista = (ctx.atividades || []).map(a => '- id ' + a.id + ': ' + a.atividade + ' (' + a.onde + ')').join('\n') || '(nenhuma atividade cadastrada na Produção neste dia)';
  const sistema = 'Você organiza o relato falado de um mestre de obras ou engenheiro em campos do Relatório Diário de Obra (RDO) '
    + 'da obra SAA Rio Grande (estação de tratamento de água, Uberaba/MG). O texto vem de reconhecimento de voz e pode ter erros de transcrição: '
    + 'interprete pelo sentido. Registre só o que foi dito, sem inventar nem completar com suposições; o que não foi dito fica vazio '
    + '("", lista vazia, ou horas 0). Escreva em português, frases curtas e objetivas, no estilo de um diário de obra.\n'
    + 'Clima: Bom = sol/tempo firme; Nublado; Chuva = choveu mas deu para trabalhar; Impraticável = chuva ou condição que parou o serviço. '
    + 'Se o clima foi dito para o dia todo, use o mesmo valor em manhã e tarde.\n'
    + 'Atividades: ligue cada serviço dito a uma atividade da lista do dia pelo id; o que não estiver na lista vai em outrosServicos.\n'
    + 'Equipamentos: use de preferência estes nomes quando forem o mesmo equipamento: ' + (ctx.equipamentos || []).join(', ') + '.\n'
    + 'Ocorrências: paralisações, acidentes, falta de material, problemas de projeto, chuva que parou serviço, entregas importantes. '
    + 'Visitas: fiscalização, cliente, fornecedores, segurança do trabalho.';
  const usuario = 'Data do RDO: ' + String(corpo.data || '') + '\nEstruturas da obra: ' + (ctx.estruturas || []).join(', ')
    + '\nAtividades do dia na Produção:\n' + lista + '\n\nRelato ditado:\n"""\n' + texto + '\n"""';
  // com a chave do Gemini (gratuito), usa o Gemini; sem ela, o Claude
  if (gemini) { const g = geminiJson_(gemini, sistema, usuario, RDO_VOZ_SCHEMA); return { rdo: g.json, modelo: g.modelo }; }
  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
    payload: JSON.stringify({
      model: CLAUDE_MODELO, max_tokens: 8000,
      fallbacks: 'default', // se o modelo recusar, o servidor tenta outro modelo sozinho
      output_config: { effort: 'low', format: { type: 'json_schema', schema: RDO_VOZ_SCHEMA } }, // extração simples: esforço baixo responde rápido
      system: sistema,
      messages: [{ role: 'user', content: usuario }],
    }),
  });
  const cod = resp.getResponseCode();
  let j; try { j = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('Resposta inválida da IA (HTTP ' + cod + ').'); }
  if (cod !== 200) throw new Error('IA indisponível (HTTP ' + cod + '): ' + ((j.error && j.error.message) || '').slice(0, 200));
  if (j.stop_reason === 'refusal') throw new Error('A IA não processou este relato. Preencha o RDO manualmente.');
  if (j.stop_reason === 'max_tokens') throw new Error('Relato longo demais para organizar de uma vez: divida em partes.');
  const bloco = (j.content || []).find(b => b.type === 'text');
  if (!bloco) throw new Error('A IA não devolveu o RDO organizado.');
  return { rdo: JSON.parse(bloco.text), modelo: j.model };
}

// ---------- corpos de prova para o painel: resultados por caminhão, sem nomes ----------
function cpsResumo_() {
  return linhas('Registros2').filter(r => String(r[1]) === 'qual' && String(r[3]) === 'cp').map(r => {
    let d; try { d = JSON.parse(r[4] || '{}'); } catch (e) { d = {}; }
    const res = {};
    [3, 7, 21, 28].forEach(i => { const v = [d['r' + i + 'a'], d['r' + i + 'b']].map(Number).filter(x => x > 0); if (v.length) res[i] = Math.max.apply(null, v); });
    return { conc: String(d.conc || ''), cam: String(d.cam || ''), fck: Number(d.fck) || 0, qtd: Number(d.qtd) || 0, data: dataISO(r[2]), status: String(r[5] || ''), res: res };
  });
}

// ---------- painel: quando os dados que ele mostra mudaram pela última vez ----------
// Lê a aba Historico de trás para frente e devolve a data/hora da última alteração de aço, semanas, equipes, ocorrências,
// frentes de serviço, forma, configuração ou base de itens (acessos, RDO, presença e fotos não contam). Sem nomes.
const ALTERA_PAINEL_ = /^(Aço: |Ocorrência|Registro apagado|Frente de serviço|Configuração|Forma|Concreto|Concretagem|Base de itens|Importação)/;
function ultimaAlteracao_() {
  const sh = aba('Historico'), n = sh.getLastRow() - 1; if (n < 1) return '';
  for (let fim = n; fim > 0; fim -= 2000) {
    const ini = Math.max(1, fim - 1999), v = sh.getRange(ini + 1, 1, fim - ini + 1, 4).getValues();
    for (let i = v.length - 1; i >= 0; i--) if (ALTERA_PAINEL_.test(String(v[i][3]))) return v[i][0] instanceof Date ? v[i][0].toISOString() : String(v[i][0]);
  }
  return '';
}

// ---------- concreto: etapas do levantamento (magro, fundo + arranque, lances 1, 2 e 3 + cobertura) e concretagens ----------
// Para o painel dos gestores: sem nomes. O volume da etapa já vem somado dos caminhões (o app grava) ou estimado pelo previsto.
function concretoResumo_() {
  const etapas = linhas('Registros2').filter(r => String(r[1]) === 'concreto' && String(r[3]) === 'etapa').map(r => {
    let d; try { d = JSON.parse(r[4] || '{}'); } catch (e) { d = {}; }
    return { obra: String(d.obra || ''), etapa: Number(d.etapa) || 0, status: String(r[5] || ''), data: dataISO(r[2]), vol: Number(d.vol) || 0,
      estimado: !!d.estimado, conc: (Array.isArray(d.conc) ? d.conc : []).map(String) };
  }).filter(x => x.obra && x.etapa >= 1 && x.etapa <= 5);
  const concretagens = linhas('Concretagens').map(r => { let cams; try { cams = JSON.parse(r[8] || '[]'); } catch (e) { cams = []; }
    return { id: String(r[0]), data: dataISO(r[1]), estrutura: String(r[2] || ''), local: String(r[3] || ''), status: String(r[6] || 'Programada'),
      volPrev: Number(r[7]) || 0, cams: cams.length, vol: cams.reduce((s, k) => s + (Number(k.vol) || 0), 0) }; });
  return { etapas: etapas, concretagens: concretagens };
}

// ---------- formas (ULMA COMAIN, paredes dos floculadores): produtividade para o painel e o Power BI ----------
// m² de forma de cada etapa no projeto B291468-R00-001 (o app calcula o mesmo pela tabela de peças: fmM2Etapa).
const FORMA_ETAPAS_M2 = [['1ª etapa', 17.36], ['2ª etapa', 205.04], ['3ª etapa', 249.08], ['4ª etapa', 82.44]];
// lançamentos do módulo Forma, sem nomes de pessoas nem observações (a chave de leitura é compartilhada).
// Desde o app v84 o lançamento é semanal: data = segunda-feira da semana e "dias" = dias trabalhados; os antigos (sem "dias") são diários.
function formaDias_() {
  return linhas('Registros2').filter(r => String(r[1]) === 'forma' && String(r[3]) === 'apont').map(r => {
    let d; try { d = JSON.parse(r[4] || '{}'); } catch (e) { d = {}; }
    const sem = d.dias != null;
    return { data: r[2] instanceof Date ? dataISO(r[2]) : String(r[2]), semanal: sem, obra: String(d.obra || 'Floculador A'), ativ: String(d.ativ || 'Montagem'), etapa: String(d.etapa || ''),
      pessoas: Number(d.n) || 0, dias: sem ? Number(d.dias) || 0 : (String(d.ativ || 'Montagem') === 'Montagem' ? 1 : 0),
      mont: Number(d.mont) || 0, desm: Number(d.desm) || 0, modo: String((d.montagem && d.montagem.modo) || 'area') };
  }).sort((a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : 0);
}
// O projeto ULMA é a forma de UM floculador, usada no A, no B e no C: cada etapa vale 3 × o projeto.
// Concluída sem lançamento (aba Config FORMA_CONCLUIDAS) é por floculador: "Floculador A:1ª etapa|Floculador C:1ª etapa"
// (o formato antigo, só "1ª etapa", era do Floculador A). Mesma regra do app.
const FLOCS_ = ['Floculador A', 'Floculador B', 'Floculador C'];
function formaEtapas_(config, dias) {
  const conc = String(config.FORMA_CONCLUIDAS != null ? config.FORMA_CONCLUIDAS : 'Floculador A:1ª etapa').split('|')
    .map(x => x.indexOf(':') >= 0 ? x : 'Floculador A:' + x);
  return FORMA_ETAPAS_M2.map(([etapa, proj]) => {
    const lanc = dias.filter(x => x.etapa === etapa).reduce((s, x) => s + x.mont, 0);
    const porFloc = FLOCS_.map(f => {
      const c = conc.indexOf(f + ':' + etapa) >= 0, l = dias.filter(x => x.etapa === etapa && x.obra === f).reduce((s, x) => s + x.mont, 0);
      return { obra: f, concluida: c, lancado: l, avanco: c ? proj : Math.min(proj, l) };
    });
    const av = porFloc.reduce((s, x) => s + x.avanco, 0), tot = proj * FLOCS_.length;
    return { etapa: etapa, projeto: tot, projetoFloc: proj, lancado: lanc, concluida: porFloc.filter(x => x.concluida).map(x => x.obra.slice(-1)).join(', '),
      avanco: av, pct: tot ? av / tot : 0, porFloc: porFloc };
  });
}
function formaResumo_(config) {
  const dias = formaDias_();
  return { dias: dias, etapas: formaEtapas_(config, dias) };
}

// ---------- tabelas para o Power BI (JSON, uma linha por registro) ----------
function tabelaBI(nome) {
  const d = carregar('');
  const itens = new Map(d.itens.map(r => [String(r[0]), r]));
  const ppb = r => Number(r[9]) ? Number(r[11]) / Number(r[9]) : 0;
  const meta = Number(d.config.META_KG_ARM_DIA) || 200;
  if (nome === 'posicoes') {
    const exe = new Map();
    d.lanc.forEach(([n, c, q]) => exe.set(c, (exe.get(c) || 0) + q));
    return d.itens.map(r => {
      const q = Math.min(exe.get(String(r[0])) || 0, Number(r[9]) || 0), kg = q * ppb(r), pct = Number(r[11]) ? kg / Number(r[11]) : 0;
      return { CODIGO: r[0], EMPREENDIMENTO: r[1], ESTRUTURA: r[2], PRANCHA: r[4], POSICAO: String(r[6]), BITOLA: String(r[7]), LOCAL: r[8],
        QTD_PREVISTA: Number(r[9]) || 0, PESO_PREVISTO_KG: Number(r[11]) || 0, QTD_EXECUTADA: q, PESO_EXECUTADO_KG: kg, PCT_CONCLUIDO: pct,
        STATUS: pct >= 0.999 ? 'CONCLUÍDO' : pct > 0 ? 'EM ANDAMENTO' : 'NÃO INICIADO' };
    });
  }
  if (nome === 'lancamentos') {
    const sem = new Map(d.semanas.map(s => [s.n, s]));
    return d.lanc.map(([n, c, q, eq]) => { const r = itens.get(c) || []; return {
      SEMANA: n, INICIO: (sem.get(n) || {}).ini || '', CODIGO: c, EMPREENDIMENTO: r[1] || '', ESTRUTURA: r[2] || '', BITOLA: String(r[7] || ''),
      EQUIPE: eq, QTD: q, PESO_KG: q * ppb(r) }; });
  }
  if (nome === 'semanas') {
    const kg = new Map();
    d.lanc.forEach(([n, c, q]) => { const r = itens.get(c); if (r) kg.set(n, (kg.get(n) || 0) + q * ppb(r)); });
    return d.semanas.map(s => ({ SEMANA: s.n, INICIO: s.ini, FIM: s.fim, ARMADORES: s.arm, DIAS: s.dias, EXECUTADO_KG: kg.get(s.n) || 0,
      META_KG: meta * s.arm * s.dias, KG_ARM_DIA: s.arm * s.dias ? (kg.get(s.n) || 0) / (s.arm * s.dias) : 0 }));
  }
  if (nome === 'equipes') return d.equipes.map(e => ({ EQUIPE: e.nome, ENCARREGADO: e.encarregado, ARMADORES: e.arm, ATIVA: e.ativa ? 'SIM' : 'NÃO',
    FRENTES: escreverFrentes(e.frentes) }));
  if (nome === 'ocorrencias') return d.registros.filter(r => r.tipo === 'ocorrencia').map(r => ({ DATA: r.data, SEMANA: r.sem, EQUIPE: r.equipe,
    TIPO: r.cat, HORAS_PERDIDAS: r.horas, DESCRICAO: r.texto }));
  if (nome === 'elementos') return d.elementos.map(e => ({ EMPREENDIMENTO: e.emp, ESTRUTURA: e.est, LOCAL: e.loc, CONCRETO_MAGRO: e.magro,
    ACO_ENTREGUE: e.aco, ARRANQUE: (e.lances['A'] || {}).data || '', LANCE_1: (e.lances['1'] || {}).data || '', LANCE_2: (e.lances['2'] || {}).data || '', LANCE_3: (e.lances['3'] || {}).data || '',
    CONCRETADO: (() => { const v = Object.values(e.lances || {}); return v.length && v.every(x => x.conc) ? v.map(x => x.conc).sort().pop() : ''; })(),
    LIBERADO_CONCRETAGEM: e.lib, RESPONSAVEL: e.resp }));
  if (nome === 'config') return Object.entries(d.config).map(([k, v]) => ({ CHAVE: k, VALOR: v }));
  if (nome === 'efetivo') // histórico inteiro, sem nomes (a chave de leitura é compartilhada)
    return linhas('EfetivoDia').map(r => ({ DATA: dataISO(r[0]), EMPRESA: r[2], FUNCAO: r[3], VINCULO: r[4], TURMA: Number(r[5]) || 0,
      FALTAS: Number(r[6]) || 0, ATESTADO: Number(r[7]) || 0, FOLGA: Number(r[8]) || 0, EMPREITEIROS: Number(r[9]) || 0, TOTAL: Number(r[10]) || 0 }));
  if (nome === 'forma') // um lançamento por linha (semana e etapa; os antigos, por dia), sem nomes
    return formaResumo_(d.config).dias.map(x => ({ DATA: x.data, TIPO: x.semanal ? 'semanal' : 'diário', OBRA: x.obra, ETAPA: x.etapa, PESSOAS: x.pessoas,
      DIAS_TRABALHADOS: x.dias, PESSOAS_DIA: x.pessoas * x.dias, M2_MONTADO: x.mont, M2_DESMONTADO: x.desm,
      M2_POR_PESSOA_DIA: x.pessoas * x.dias ? x.mont / (x.pessoas * x.dias) : 0, LANCADO_POR: x.modo === 'pecas' ? 'peças' : x.modo === 'pct' ? '%' : 'm²' }));
  if (nome === 'forma_etapas') return formaResumo_(d.config).etapas.map(e => ({ ETAPA: e.etapa, M2_PROJETO: e.projeto, M2_LANCADO: e.lancado,
    CONCLUIDA_SEM_LANCAMENTO: e.concluida || 'NÃO', M2_AVANCO: e.avanco, PCT_AVANCO: e.pct }));
  return { ok: false, erro: 'Tabela desconhecida. Use: posicoes, lancamentos, semanas, equipes, ocorrencias, elementos, config, efetivo, forma, forma_etapas.' };
}

// ---------- projetos em PDF ----------
// PDFs de uma pasta ao lado da planilha: "Projetos" (armação) ou "Formas" (projeto e catálogo das formas, separados da armação)
const PASTAS_PDF = ['Projetos', 'Formas'];
function listarProjetos(nome) {
  nome = PASTAS_PDF.indexOf(nome) >= 0 ? nome : 'Projetos';
  const arquivos = [];
  const it = pasta(nome).getFilesByType(MimeType.PDF);
  while (it.hasNext()) {
    const f = it.next();
    arquivos.push({ id: f.getId(), nome: f.getName(), tamanho: f.getSize(), atualizado: f.getLastUpdated().toISOString() });
  }
  arquivos.sort((a, b) => a.nome.localeCompare(b.nome));
  return { arquivos: arquivos, pasta: nome }; // "pasta": o app confere que veio a pasta pedida (Code.gs antigo só tinha Projetos)
}

// O Google não entrega respostas grandes (devolve a página "Drive: Não foi possível abrir o arquivo"),
// então o PDF vai em pedaços: o app pede {ini, tam} (posição e tamanho em bytes, 256 KB a 4 MB) e, se um pedaço
// falhar, pede menor. "parte" (pedaços fixos de 2 MB) fica para o app v58; sem nada (app antigo), vai o arquivo inteiro.
const TAM_PARTE_PDF = 2 * 1024 * 1024;
function lerPdf(id, parte, ini, tam) {
  const donos = PASTAS_PDF.map(n => pasta(n).getId());
  let f;
  try { f = DriveApp.getFileById(id); } catch (e) { throw new Error('Arquivo não encontrado.'); }
  // só entrega arquivos que estão na pasta Projetos ou Formas
  let dentro = false;
  for (const p = f.getParents(); p.hasNext();) if (donos.indexOf(p.next().getId()) >= 0) { dentro = true; break; }
  if (!dentro || f.getMimeType() !== MimeType.PDF) throw new Error('Arquivo fora das pastas Projetos e Formas.');
  if (ini != null) return Object.assign(pedacoPdf_(f, Number(ini) || 0, Number(tam) || TAM_PARTE_PDF), { nome: f.getName(), atualizado: f.getLastUpdated().toISOString() });
  const bytes = f.getBlob().getBytes(), base = { nome: f.getName(), atualizado: f.getLastUpdated().toISOString(), total: bytes.length };
  if (parte == null) return Object.assign(base, { b64: Utilities.base64Encode(bytes) });
  const partes = Math.max(1, Math.ceil(bytes.length / TAM_PARTE_PDF)), k = Math.min(Math.max(0, Number(parte) || 0), partes - 1);
  return Object.assign(base, { parte: k, partes: partes, b64: Utilities.base64Encode(bytes.slice(k * TAM_PARTE_PDF, (k + 1) * TAM_PARTE_PDF)) });
}
// Lê só o trecho pedido direto do Drive (cabeçalho Range), sem carregar o arquivo inteiro na memória do script,
// que era lento demais com as pranchas grandes. Se o Drive não aceitar, usa o jeito antigo (arquivo inteiro).
function pedacoPdf_(f, ini, tam) {
  const total = f.getSize(), t = Math.min(Math.max(tam, 262144), 4194304), a = Math.min(Math.max(0, ini), total), fim = Math.min(a + t, total);
  if (fim <= a) return { total: total, ini: a, b64: '' };
  let pedaco = null;
  try {
    const r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + f.getId() + '?alt=media&supportsAllDrives=true', {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), Range: 'bytes=' + a + '-' + (fim - 1) }, muteHttpExceptions: true });
    const cod = r.getResponseCode();
    if (cod === 206) pedaco = r.getContent();
    else if (cod === 200) pedaco = r.getContent().slice(a, fim); // ignorou o Range: veio tudo
  } catch (e) { /* sem acesso à API do Drive: usa o jeito antigo */ }
  if (!pedaco || pedaco.length !== fim - a) pedaco = f.getBlob().getBytes().slice(a, fim);
  return { total: total, ini: a, b64: Utilities.base64Encode(pedaco) };
}

// ---------- leitura ----------
function aba(nome) {
  const sh = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!sh) throw new Error('Aba "' + nome + '" não encontrada. Rode configurar().');
  return sh;
}

function linhas(nome) {
  const sh = aba(nome), n = sh.getLastRow() - 1;
  const rs = n > 0 ? sh.getRange(2, 1, n, ABAS[nome].length).getValues().filter(r => r[0] !== '') : [];
  for (const r of rs) for (const c of (COLS_CODIGO[nome] || [])) {
    if (r[c] instanceof Date) r[c] = codigoDeData(r[c]); else if (r[c] !== '') r[c] = String(r[c]);
  }
  return rs;
}

// Versão do script: o app avisa quando o Google ainda está rodando uma versão anterior.
// 28: o PDF da concretagem (PDF_ID) guarda até 49.000 caracteres (antes, 300: o mapa das paredes chegava cortado).
// 29: leitura do ticket da concreteira por foto (acao 'ticket'), erros e estado dos celulares (abas Erros e Aparelhos)
//     e resultados dos corpos de prova no painel (sem nomes).
// 30: ticket lido pelo Claude Haiku 5.5 (bem mais barato que o modelo do RDO por voz).
// 31: leitura do ticket por foto retirada (sem chave da IA por enquanto).
// 32: sincronização mais rápida: área pintada nova vai no fim da aba ConcretagemTracos (antes a aba inteira era lida e
//     regravada a cada envio), leitura dos traços só das linhas da concretagem e observação da concretagem até 2.000 caracteres.
const VERSAO_SCRIPT = 35;

// Colunas de código que precisam ficar como TEXTO. Sem isso o Planilhas converte
// "DEC-0001" em data (dez/2001) e o código se perde.
const COLS_TEXTO = { Itens: [0, 3, 6, 12], Lancamentos: [1], Registros: [0, 5], Equipes: [0], Elementos: [0, 3, 4, 5, 6, 8, 11], Config: [0, 1],
  Efetivo: [0, 1, 2], EfetivoDia: [0, 1, 2, 3], Pessoas: [0, 1, 2, 3], Presencas: [0, 1, 2, 3, 4, 6],
  Atividades: [0, 1, 2, 3, 4, 6, 7, 9, 11, 12], Historico: [1, 2, 3, 4], RDO: [0, 1, 2, 3, 5, 7],
  Concretagens: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12], ConcretagemTracos: [0, 1, 5, 6], Registros2: [0, 1, 2, 3, 4, 5, 6, 8],
  Erros: [1, 2, 3, 4, 5, 6], Aparelhos: [0, 1, 2, 3, 5] };
const COLS_CODIGO = { Itens: [0], Lancamentos: [1], Registros: [5], Equipes: [], Elementos: [], Config: [] };

// Desfaz a conversão automática: data dez/2001 -> "DEC-0001", dez/1935 -> "DEC-0035"
function codigoDeData(v) {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const mes = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(Utilities.formatDate(v, tz, 'M')) - 1];
  const y = Number(Utilities.formatDate(v, tz, 'yyyy'));
  const n = (y >= 2000 && y < 2030) ? y - 2000 : (y >= 1930 && y < 2000) ? y - 1900 : y;
  return mes + '-' + ('000' + n).slice(-4);
}

function dataISO(v) {
  // fuso da PLANILHA (o do projeto do script costuma ser o dos EUA e desloca a data em 1 dia)
  if (v instanceof Date) return Utilities.formatDate(v, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  const s = String(v || '').trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? m[3] + '-' + m[2] + '-' + m[1] : s;
}

// Frentes na planilha: "FLOCULADORES — laje de fundo; DECANTADORES"
function lerFrentes(txt) {
  return String(txt || '').split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const [est, det] = s.split(' — ');
    return { est: est.trim(), det: (det || '').trim() };
  });
}
function escreverFrentes(lista) {
  return (lista || []).filter(f => f && f.est).map(f => f.det ? f.est + ' — ' + f.det : f.est).join('; ');
}

function equipePadrao() {
  const e = linhas('Equipes').find(r => String(r[2]).toUpperCase() !== 'NÃO' && String(r[2]).toUpperCase() !== 'NAO');
  return e ? String(e[0]) : 'Equipe 1';
}

function carregar(versaoCliente) {
  const itens = linhas('Itens').map(r => r.map(v => v instanceof Date ? dataISO(v) : v));
  const versao = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify(itens)));
  const semanas = linhas('Semanas').map(r => ({
    n: Number(r[0]), ini: dataISO(r[1]), fim: dataISO(r[2]), periodo: String(r[3]), arm: Number(r[4]) || 0, dias: Number(r[5]) || 0,
  }));
  const eqPad = equipePadrao();
  const lanc = linhas('Lancamentos').filter(r => Number(r[2]) > 0).map(r => [Number(r[0]), String(r[1]), Number(r[2]), String(r[6] || eqPad)]);
  const equipes = linhas('Equipes').map(r => ({ nome: String(r[0]), arm: Number(r[1]) || 0, ativa: !/^N[ÃA]O$/i.test(String(r[2])),
    encarregado: String(r[3] || ''), frentes: lerFrentes(r[4]) }));
  const registros = linhas('Registros').map(r => ({
    id: String(r[0]), data: dataISO(r[1]), sem: Number(r[2]) || 0, equipe: String(r[3]), tipo: String(r[4]), cod: String(r[5]),
    cat: String(r[6]), horas: Number(r[7]) || 0, texto: String(r[8]), url: String(r[9]),
  }));
  const lerJson = s => { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } };
  const elementos = linhas('Elementos').map(r => ({
    chave: String(r[0]), emp: String(r[1]), est: String(r[2]), loc: String(r[3]),
    magro: r[4] ? dataISO(r[4]) : '', aco: r[5] ? dataISO(r[5]) : '', check: lerJson(r[6]), resp: String(r[7] || ''),
    lib: r[8] ? dataISO(r[8]) : '', obs: String(r[9] || ''), lances: lerJson(r[11]),
  }));
  const config = {};
  linhas('Config').forEach(r => { config[String(r[0])] = r[1] instanceof Date ? dataISO(r[1]) : String(r[1]); });
  const ativo = v => !/^N[ÃA]O$/i.test(String(v));
  const efetivo = linhas('Efetivo').map(r => ({ id: String(r[0]), empresa: String(r[1]), funcao: String(r[2]), vinculo: String(r[3] || ''),
    quadro: Number(r[4]) || 0, ordem: Number(r[5]) || 0, ativo: ativo(r[6]) }));
  const pessoas = linhas('Pessoas').map(r => ({ id: String(r[0]), nome: String(r[1]), fid: String(r[2] || ''), matricula: String(r[3] || ''),
    ativo: ativo(r[4]), obs: String(r[5] || '') }));
  // dias recentes agrupados: { "2026-10-01": { id: [turma, faltas, atestado, folga, empreiteiros] } }
  const desde = Utilities.formatDate(new Date(Date.now() - DIAS_EFETIVO * 864e5), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  const efDia = {}, presencas = {};
  linhas('EfetivoDia').forEach(r => { const d = dataISO(r[0]); if (d >= desde) (efDia[d] = efDia[d] || {})[String(r[1])] = [5, 6, 7, 8, 9].map(c => Number(r[c]) || 0); });
  // { "2026-10-01": { idPessoa: "P 07:12" | "F" | ... } }
  // quem marcou: só hoje e ontem (é o que aparece na tela)
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone(), ontem = Utilities.formatDate(new Date(Date.now() - 864e5), tz, 'yyyy-MM-dd');
  const presPor = {};
  linhas('Presencas').forEach(r => {
    const d = dataISO(r[0]); if (d < desde || !r[3]) return;
    (presencas[d] = presencas[d] || {})[String(r[1])] = (String(r[3]) + ' ' + String(r[4] || '')).trim();
    if (d >= ontem && r[6]) (presPor[d] = presPor[d] || {})[String(r[1])] = String(r[6]);
  });
  // atividades em aberto e as concluídas nos últimos dias
  const corte = new Date(Date.now() - DIAS_ATIVIDADES * 864e5);
  const lerJsonA = (s, pad) => { try { return JSON.parse(s || pad); } catch (e) { return JSON.parse(pad); } };
  const atividades = linhas('Atividades').filter(r => String(r[4]) !== 'Concluída' || !(r[10] instanceof Date) || r[10] >= corte).map(r => ({
    id: String(r[0]), atividade: String(r[1]), estrutura: String(r[2] || ''), local: String(r[3] || ''), status: String(r[4] || 'A fazer'),
    progresso: Number(r[5]) || 0, equipes: lerJsonA(r[6], '{}'), obs: String(r[7] || ''),
    criadoEm: r[8] instanceof Date ? r[8].toISOString() : String(r[8] || ''), criadoPor: String(r[9] || ''),
    atualizadoEm: r[10] instanceof Date ? r[10].toISOString() : String(r[10] || ''), atualizadoPor: String(r[11] || ''), hist: lerJsonA(r[12], '[]'),
  }));
  const out = { script: VERSAO_SCRIPT, versao: versao, semanas: semanas, lanc: lanc, equipes: equipes, registros: registros,
    elementos: elementos, config: config, efetivo: efetivo, efDia: efDia, pessoas: pessoas, presencas: presencas,
    presPor: presPor, atividades: atividades, rdo: lerRdos(), concretagens: lerConcretagens(), registros2: lerRegistros2(), leitura: chaveLeitura(), agora: new Date().toISOString() };
  if (versaoCliente !== versao) out.itens = itens; // só manda a base quando mudou
  return out;
}

// RDOs dos últimos dias: { "2026-10-01": {numero, status, dados, ...} }. O número é a ordem do dia entre todos os RDOs.
function lerRdos() {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const desde = Utilities.formatDate(new Date(Date.now() - DIAS_RDO * 864e5), tz, 'yyyy-MM-dd');
  const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
  const rs = linhas('RDO').map(r => [dataISO(r[0])].concat(r.slice(1))).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const out = {};
  rs.forEach((r, k) => {
    if (r[0] < desde) return;
    let dados; try { dados = JSON.parse(r[2] || '{}'); } catch (e) { dados = {}; }
    out[r[0]] = { numero: k + 1, status: String(r[1] || 'Rascunho'), dados: dados, criadoPor: String(r[3] || ''), criadoEm: iso(r[4]),
      atualizadoPor: String(r[5] || ''), atualizadoEm: iso(r[6]), fechadoPor: String(r[7] || ''), fechadoEm: iso(r[8]) };
  });
  return out;
}

// Concretagens em aberto e as concluídas nos últimos dias (os traços pintados vêm à parte, por concretagem: acao 'ccTracos')
function lerConcretagens() {
  const corte = Utilities.formatDate(new Date(Date.now() - DIAS_CONCRETAGEM * 864e5), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
  return linhas('Concretagens').map(r => [r[0], dataISO(r[1])].concat(r.slice(2)))
    .filter(r => String(r[6]) !== 'Concluída' || r[1] >= corte)
    .map(r => { let cams; try { cams = JSON.parse(r[8] || '[]'); } catch (e) { cams = []; }
      return { id: String(r[0]), data: r[1], estrutura: String(r[2] || ''), local: String(r[3] || ''), pdfId: String(r[4] || ''), pdfNome: String(r[5] || ''),
        status: String(r[6] || 'Programada'), volPrev: Number(r[7]) || 0, cams: cams, obs: String(r[9] || ''),
        criadoPor: String(r[10] || ''), atualizadoPor: String(r[12] || ''), atualizadoEm: iso(r[13]) }; });
}
// Registros dos módulos novos: os dos últimos DIAS_REG2 dias e os que ainda não foram fechados (cadastros vão sempre)
function lerRegistros2() {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const corte = Utilities.formatDate(new Date(Date.now() - DIAS_REG2 * 864e5), tz, 'yyyy-MM-dd');
  const iso = v => v instanceof Date ? v.toISOString() : String(v || '');
  return linhas('Registros2').map(r => [r[0], r[1], dataISO(r[2])].concat(r.slice(3)))
    .filter(r => r[2] >= corte || !REG2_FECHADO.test(String(r[5] || '')))
    .map(r => { let dados; try { dados = JSON.parse(r[4] || '{}'); } catch (e) { dados = {}; }
      return { id: String(r[0]), modulo: String(r[1]), data: r[2], tipo: String(r[3] || ''), dados: dados, status: String(r[5] || ''),
        criadoPor: String(r[6] || ''), criadoEm: iso(r[7]), atualizadoPor: String(r[8] || ''), atualizadoEm: iso(r[9]) }; });
}
// traços de uma concretagem: lê só a coluna da concretagem e depois só as linhas dela (em blocos seguidos), não a aba inteira
function lerTracos(conc) {
  const sh = aba('ConcretagemTracos'), n = sh.getLastRow() - 1, cols = ABAS.ConcretagemTracos.length;
  if (n <= 0) return [];
  const ks = sh.getRange(2, 2, n, 1).getValues().map((r, k) => String(r[0]) === conc ? k : -1).filter(k => k >= 0);
  const out = [];
  for (let i = 0; i < ks.length;) {
    let j = i; while (j + 1 < ks.length && ks[j + 1] === ks[j] + 1) j++;
    sh.getRange(2 + ks[i], 1, j - i + 1, cols).getValues().forEach(r => { if (r[0] !== '') out.push({
      id: String(r[0]), conc: String(r[1]), cam: Number(r[2]) || 0, pag: Number(r[3]) || 1, w: Number(r[4]) || 10,
      pts: String(r[5] || '').split(',').map(Number), por: String(r[6] || '') }); });
    i = j + 1;
  }
  return out;
}
// ids dos traços já gravados (só a 1ª coluna): reenvio de um traço não duplica
function idsTracos_() {
  const sh = aba('ConcretagemTracos'), n = sh.getLastRow() - 1;
  return new Map(n > 0 ? sh.getRange(2, 1, n, 1).getValues().filter(r => r[0] !== '').map(r => [String(r[0]), -1]) : []);
}
// linhas novas no fim da aba (sem apagar e regravar o que já está lá)
function acrescentar_(sh, cols, dados) {
  if (!dados.length) return;
  const ini = sh.getLastRow() + 1, texto = new Set(COLS_TEXTO[sh.getName()] || []);
  for (const c of texto) sh.getRange(ini, c + 1, dados.length, 1).setNumberFormat('@');
  sh.getRange(ini, 1, dados.length, cols).setValues(dados.map(r => r.map((v, c) => texto.has(c) && v !== '' && v != null ? String(v) : v)));
}

// ---------- gravação ----------
function aplicar(ops, usuario) {
  usuario = usuario || {};
  if (!ops.length) return;
  const itens = new Map(linhas('Itens').map(r => [String(r[0]), r]));
  const agora = new Date();
  const eqPad = equipePadrao();

  // cada aba é carregada, alterada em memória e gravada de uma vez
  const L = linhas('Lancamentos');
  const idxL = new Map(L.map((r, k) => [r[0] + '|' + r[1] + '|' + (r[6] || eqPad), k]));
  const S = linhas('Semanas');
  const idxS = new Map(S.map((r, k) => [Number(r[0]), k]));
  const E = linhas('Equipes');
  const idxE = new Map(E.map((r, k) => [String(r[0]), k]));
  let R = linhas('Registros');
  const idxR = () => new Map(R.map((r, k) => [String(r[0]), k]));
  let iR = idxR();
  const El = linhas('Elementos');
  const iEl = new Map(El.map((r, k) => [String(r[0]), k]));
  const Cf = linhas('Config');
  const mudou = {};
  // abas do efetivo só são lidas se alguma operação mexer nelas
  const temEf = ops.some(op => /^(funcao|funcaoDel|dia|pessoa|pessoaDel|pres)$/.test(op.t));
  const ler = nome => temEf ? linhas(nome) : [];
  const indice = (L, chave) => new Map(L.map((r, k) => [chave(r), k]));
  let Ef = ler('Efetivo'), Dia = ler('EfetivoDia').map(r => [dataISO(r[0])].concat(r.slice(1))), Pe = ler('Pessoas'),
      Pr = ler('Presencas').map(r => [dataISO(r[0])].concat(r.slice(1)));
  let iEf = indice(Ef, r => String(r[0])), iDia = indice(Dia, r => r[0] + '|' + r[1]),
      iPe = indice(Pe, r => String(r[0])), iPr = indice(Pr, r => r[0] + '|' + r[1]);
  const dataOk = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
  // produção
  const temAt = ops.some(op => /^ativ/.test(op.t));
  let At = temAt ? linhas('Atividades') : [], iAt = indice(At, r => String(r[0]));
  const temCc = ops.some(op => /^(conc|concDel|ccTraco|ccTracoDel)$/.test(op.t));
  let Cc = temCc ? linhas('Concretagens').map(r => [r[0], dataISO(r[1])].concat(r.slice(2))) : [], iCc = indice(Cc, r => String(r[0]));
  // traços (áreas pintadas): a aba cresce a cada pincelada. Traço novo vai no fim da aba; ler e regravar tudo só ao apagar
  const apagaTr = ops.some(op => op.t === 'ccTracoDel' || op.t === 'concDel'), temTr = apagaTr || ops.some(op => op.t === 'ccTraco');
  let Tr = apagaTr ? linhas('ConcretagemTracos') : [], iTr = apagaTr ? indice(Tr, r => String(r[0])) : temTr ? idsTracos_() : new Map();
  const novosTr = [];
  const temR2 = ops.some(op => op.t === 'reg2' || op.t === 'reg2Del');
  let R2 = temR2 ? linhas('Registros2').map(r => [r[0], r[1], dataISO(r[2])].concat(r.slice(3))) : [], iR2 = indice(R2, r => String(r[0]));
  const temRdo = ops.some(op => op.t === 'rdo');
  const Rd = temRdo ? linhas('RDO').map(r => [dataISO(r[0])].concat(r.slice(1))) : [], iRd = indice(Rd, r => r[0]);
  // rastreabilidade: quem está usando o app (login por cargo)
  const nomeU = String(usuario.nome || '').trim().slice(0, 80), cargoU = String(usuario.cargo || '').trim().slice(0, 60);
  const quem = nomeU ? nomeU + (cargoU ? ' (' + cargoU + ')' : '') : 'sem login';

  const linhaLanc = (sem, cod, qtd, eq) => {
    const it = itens.get(cod);
    const ppb = it && Number(it[9]) ? Number(it[11]) / Number(it[9]) : 0;
    return [sem, cod, qtd, Math.round(qtd * ppb * 100) / 100, it ? it[2] : '', agora, eq];
  };
  const linhaReg = (op, url) => [String(op.id), op.data || dataISO(agora), Number(op.sem) || '', op.equipe || '', op.tipo || 'obs',
    op.cod || '', op.cat || '', Number(op.horas) || '', String(op.texto || '').slice(0, 2000), url || '', agora];

  for (const op of ops) {
    if (op.t === 'lanc') {
      const sem = Number(op.sem), cod = String(op.cod), eq = String(op.equipe || eqPad);
      const qtd = Math.max(0, Math.round(Number(op.qtd) || 0));
      if (!itens.has(cod)) continue; // código que não existe mais na base
      const chave = sem + '|' + cod + '|' + eq, k = idxL.get(chave);
      if (k != null) L[k] = linhaLanc(sem, cod, qtd, eq);
      else if (qtd > 0) { idxL.set(chave, L.length); L.push(linhaLanc(sem, cod, qtd, eq)); }
      mudou.L = true;
    } else if (op.t === 'sem') {
      const n = Number(op.n), k = idxS.get(n);
      const atual = k != null ? S[k] : [n, op.ini || '', op.fim || '', op.periodo || '', 0, 0];
      const linha = [n,
        op.ini != null ? op.ini : atual[1], op.fim != null ? op.fim : atual[2], op.periodo != null ? op.periodo : atual[3],
        op.arm != null ? Number(op.arm) : atual[4], op.dias != null ? Number(op.dias) : atual[5]];
      if (k != null) S[k] = linha; else { idxS.set(n, S.length); S.push(linha); }
      mudou.S = true;
    } else if (op.t === 'elem') {
      // campos ausentes ficam como estão; '' limpa
      const chave = String(op.chave || ''); if (!chave) continue;
      const k = iEl.get(chave), atual = k != null ? El[k] : [chave, op.emp || '', op.est || '', op.loc || '', '', '', '', '', '', '', '', ''];
      const campo = (v, i) => v != null ? v : atual[i];
      const linha = [chave, campo(op.emp, 1), campo(op.est, 2), campo(op.loc, 3), campo(op.magro, 4), campo(op.aco, 5),
        op.check != null ? JSON.stringify(op.check) : atual[6], campo(op.resp, 7), campo(op.lib, 8), campo(op.obs, 9), agora,
        op.lances != null ? JSON.stringify(op.lances) : atual[11]];  // lances: {"1":{data,resp,check,obs}, ...}
      if (k != null) El[k] = linha; else { iEl.set(chave, El.length); El.push(linha); }
      mudou.El = true;
    } else if (op.t === 'config') {
      const chave = String(op.chave || ''); if (!chave) continue;
      const k = Cf.findIndex(r => String(r[0]) === chave);
      if (k >= 0) Cf[k] = [chave, String(op.valor)]; else Cf.push([chave, String(op.valor)]);
      mudou.Cf = true;
    } else if (op.t === 'equipe') {
      const nome = String(op.nome || '').trim(); if (!nome) continue;
      const k = idxE.get(nome), atual = k != null ? E[k] : [nome, 0, 'SIM', '', ''];
      const linha = [nome, op.arm != null ? Number(op.arm) : atual[1], op.ativa != null ? (op.ativa ? 'SIM' : 'NÃO') : atual[2],
        op.encarregado != null ? String(op.encarregado) : atual[3], op.frentes != null ? escreverFrentes(op.frentes) : atual[4]];
      if (k != null) E[k] = linha; else { idxE.set(nome, E.length); E.push(linha); }
      mudou.E = true;
    } else if (op.t === 'reg') {
      const k = iR.get(String(op.id));
      if (k != null) R[k] = linhaReg(op, R[k][9]); else { R.push(linhaReg(op)); iR = idxR(); }
      mudou.R = true;
    } else if (op.t === 'regDel') {
      const k = iR.get(String(op.id));
      if (k == null) continue;
      const url = String(R[k][9]);
      const m = url.match(/[-\w]{25,}/);
      if (m) { try { DriveApp.getFileById(m[0]).setTrashed(true); } catch (e) { /* já removida */ } }
      R.splice(k, 1); iR = idxR(); mudou.R = true;
    } else if (op.t === 'foto') {
      if (iR.has(String(op.id))) continue; // reenvio: a foto já foi gravada
      const bytes = Utilities.base64Decode(String(op.b64 || ''));
      if (!bytes.length) continue;
      const nome = 'S' + op.sem + '_' + (op.cod || 'geral') + '_' + String(op.id).slice(0, 8) + '.jpg';
      const f = pasta('Fotos').createFile(Utilities.newBlob(bytes, 'image/jpeg', nome));
      R.push(linhaReg(Object.assign({}, op, { tipo: 'foto' }), f.getUrl())); iR = idxR();
      mudou.R = true;
    } else if (op.t === 'funcao') {
      // linha do quadro (empresa + função); campos ausentes ficam como estão
      const id = String(op.id || ''); if (!id) continue;
      const k = iEf.get(id), atual = k != null ? Ef[k] : [id, '', '', '', 0, 0, 'SIM', ''];
      const txt = (v, i) => v != null ? String(v).trim().slice(0, 120) : atual[i];
      const linha = [id, txt(op.empresa, 1), txt(op.funcao, 2), txt(op.vinculo, 3), op.quadro != null ? Number(op.quadro) || 0 : atual[4],
        op.ordem != null ? Number(op.ordem) || 0 : atual[5], op.ativo != null ? (op.ativo ? 'SIM' : 'NÃO') : atual[6], agora];
      if (!linha[1] || !linha[2]) continue;
      if (k != null) Ef[k] = linha; else { iEf.set(id, Ef.length); Ef.push(linha); }
      // nome novo também nos dias já lançados (a aba EfetivoDia fica legível sem cruzar com o quadro)
      Dia.forEach(r => { if (r && r[1] === id) { r[2] = linha[1]; r[3] = linha[2]; r[4] = linha[3]; } });
      mudou.Ef = mudou.Dia = true;
    } else if (op.t === 'funcaoDel') {
      // cadastro feito por engano: some a função e os dias dela (o app só deixa excluir sem nomes ligados)
      const id = String(op.id || ''); if (!iEf.has(id)) continue;
      Ef = Ef.filter(r => String(r[0]) !== id); iEf = indice(Ef, r => String(r[0]));
      Dia = Dia.filter(r => r && r[1] !== id); iDia = indice(Dia, r => r[0] + '|' + r[1]);
      mudou.Ef = mudou.Dia = true;
    } else if (op.t === 'dia') {
      // v = [turma, faltas, atestado, folga, empreiteiros]; v vazio apaga a linha do dia
      const d = String(op.data || ''), id = String(op.id || ''); if (!dataOk(d) || !id) continue;
      const k = iDia.get(d + '|' + id);
      if (!op.v) { if (k != null) Dia[k] = null; mudou.Dia = true; continue; }
      const f = Ef[iEf.get(id)]; if (!f) continue;
      const v = [0, 1, 2, 3, 4].map(i => Math.max(0, Math.round(Number(op.v[i]) || 0)));
      const linha = [d, id, f[1], f[2], f[3]].concat(v, [totalDia_(v), agora]);
      if (k != null) Dia[k] = linha; else { iDia.set(d + '|' + id, Dia.length); Dia.push(linha); }
      mudou.Dia = true;
    } else if (op.t === 'pessoa') {
      const id = String(op.id || ''); if (!id) continue;
      const k = iPe.get(id), atual = k != null ? Pe[k] : [id, '', '', '', 'SIM', '', ''];
      const txt = (v, i) => v != null ? String(v).trim().slice(0, 200) : atual[i];
      const linha = [id, txt(op.nome, 1), txt(op.fid, 2), txt(op.matricula, 3), op.ativo != null ? (op.ativo ? 'SIM' : 'NÃO') : atual[4], txt(op.obs, 5), agora];
      if (!linha[1]) continue;
      if (k != null) Pe[k] = linha; else { iPe.set(id, Pe.length); Pe.push(linha); }
      mudou.Pe = true;
    } else if (op.t === 'pessoaDel') {
      // cadastro feito por engano: some a pessoa e as marcações dela
      const id = String(op.id || ''); if (!iPe.has(id)) continue;
      Pe = Pe.filter(r => String(r[0]) !== id); iPe = indice(Pe, r => String(r[0]));
      Pr = Pr.filter(r => r && r[1] !== id); iPr = indice(Pr, r => r[0] + '|' + r[1]);
      mudou.Pe = mudou.Pr = true;
    } else if (op.t === 'pres') {
      // st: P (chegou, com hora), F, AT, FO; '' apaga a marcação
      const d = String(op.data || ''), id = String(op.id || ''), st = String(op.st || '');
      if (!dataOk(d) || !id || (st && !SITUACOES[st])) continue;
      const k = iPr.get(d + '|' + id), p = Pe[iPe.get(id)];
      if (!st) { if (k != null) Pr[k] = null; }
      else {
        const linha = [d, id, p ? p[1] : '', st, st === 'P' ? String(op.hora || '').slice(0, 5) : '', agora, quem];
        if (k != null) Pr[k] = linha; else { iPr.set(d + '|' + id, Pr.length); Pr.push(linha); }
      }
      mudou.Pr = true;
    } else if (op.t === 'ativ') {
      // campos ausentes ficam como estão; logs = entradas novas do histórico (o id evita repetir num reenvio)
      const id = String(op.id || ''); if (!id) continue;
      const k = iAt.get(id), atual = k != null ? At[k] : [id, '', '', '', 'A fazer', 0, '{}', '', agora, quem, '', '', '[]'];
      const txt = (v, i) => v != null ? String(v).trim().slice(0, 300) : atual[i];
      let hist; try { hist = JSON.parse(atual[12] || '[]'); } catch (e) { hist = []; }
      const ids = new Set(hist.map(h => h.id));
      for (const l of (op.logs || [])) if (l && l.id && !ids.has(String(l.id))) {
        hist.push({ id: String(l.id), em: String(l.em || agora.toISOString()), por: String(l.por || quem).slice(0, 120), txt: String(l.txt || '').slice(0, 300) });
        ids.add(String(l.id));
      }
      const linha = [id, txt(op.atividade, 1), txt(op.estrutura, 2), txt(op.local, 3), txt(op.status, 4),
        op.progresso != null ? Math.max(0, Math.min(100, Number(op.progresso) || 0)) : atual[5],
        op.equipes != null ? JSON.stringify(op.equipes) : atual[6], txt(op.obs, 7), atual[8] || agora, atual[9] || quem,
        agora, quem, JSON.stringify(hist.slice(-80))];
      if (!linha[1]) continue;
      if (k != null) At[k] = linha; else { iAt.set(id, At.length); At.push(linha); }
      mudou.At = true;
    } else if (op.t === 'conc') {
      // campos ausentes ficam como estão
      const id = String(op.id || ''); if (!id) continue;
      const k = iCc.get(id), atual = k != null ? Cc[k] : [id, '', '', '', '', '', 'Programada', 0, '[]', '', quem, agora, '', ''];
      const txt = (v, i) => v != null ? String(v).trim().slice(0, 300) : atual[i];
      const d = op.data != null && dataOk(String(op.data)) ? String(op.data) : atual[1];
      // PDF_ID: id do Drive ou "mapa:{...}" (mapa das paredes, gerado no app): não pode ser cortado em 300 caracteres
      const pdfId = op.pdfId != null ? String(op.pdfId).trim().slice(0, 49000) : atual[4];
      const linha = [id, d, txt(op.estrutura, 2), txt(op.local, 3), pdfId, txt(op.pdfNome, 5), txt(op.status, 6),
        op.volPrev != null ? Number(op.volPrev) || 0 : atual[7], op.cams != null ? JSON.stringify(op.cams) : atual[8], op.obs != null ? String(op.obs).trim().slice(0, 2000) : atual[9],
        atual[10] || quem, atual[11] || agora, quem, agora];
      if (!linha[1] || !linha[2]) continue;
      if (k != null) Cc[k] = linha; else { iCc.set(id, Cc.length); Cc.push(linha); }
      mudou.Cc = true;
    } else if (op.t === 'concDel') {
      // excluir a concretagem apaga também as áreas pintadas dela
      const id = String(op.id || ''); if (!iCc.has(id)) continue;
      Cc = Cc.filter(r => String(r[0]) !== id); iCc = indice(Cc, r => String(r[0]));
      Tr = Tr.filter(r => r && String(r[1]) !== id); iTr = indice(Tr, r => String(r[0]));
      mudou.Cc = mudou.Tr = true;
    } else if (op.t === 'ccTraco') {
      const id = String(op.id || ''), pts = (op.pts || []).map(v => Math.round(Number(v) * 10) / 10).filter(v => isFinite(v));
      if (!id || !op.conc || pts.length < 2 || iTr.has(id)) continue; // traço já gravado: reenvio
      const linha = [id, String(op.conc), Number(op.cam) || 0, Number(op.pag) || 1, Number(op.w) || 10, pts.join(',').slice(0, 49000), quem, agora];
      if (apagaTr) { iTr.set(id, Tr.length); Tr.push(linha); } else { iTr.set(id, -1); novosTr.push(linha); }
      mudou.Tr = true;
    } else if (op.t === 'ccTracoDel') {
      const k = iTr.get(String(op.id || '')); if (k == null) continue;
      Tr[k] = null; iTr.delete(String(op.id));
      mudou.Tr = true;
    } else if (op.t === 'rdo') {
      // RDO fechado só muda ao reabrir (status 'Rascunho'); ao fechar grava quem fechou e quando
      const d = String(op.data || ''); if (!dataOk(d)) continue;
      const k = iRd.get(d), atual = k != null ? Rd[k] : [d, 'Rascunho', '{}', quem, agora, '', '', '', ''];
      const st = op.status === 'Fechado' || op.status === 'Rascunho' ? op.status : null;
      if (atual[1] === 'Fechado' && st !== 'Rascunho') continue;
      const novoSt = st || atual[1] || 'Rascunho';
      const js = op.dados != null ? JSON.stringify(op.dados) : null;
      if (js && js.length > 49000) throw new Error('RDO de ' + d + ' grande demais para a planilha: encurte os textos.');
      const linha = [d, novoSt, js != null ? js : atual[2], atual[3] || quem, atual[4] || agora, quem, agora,
        novoSt === 'Fechado' ? (atual[1] === 'Fechado' ? atual[7] : quem) : '', novoSt === 'Fechado' ? (atual[1] === 'Fechado' ? atual[8] : agora) : ''];
      if (k != null) Rd[k] = linha; else { iRd.set(d, Rd.length); Rd.push(linha); }
      mudou.Rd = true;
    } else if (op.t === 'reg2') {
      // módulos novos: campos ausentes ficam como estão; DADOS é trocado inteiro quando vem
      const id = String(op.id || ''); if (!id) continue;
      const k = iR2.get(id), atual = k != null ? R2[k] : [id, '', '', '', '{}', '', quem, agora, '', ''];
      const txt = (v, i) => v != null ? String(v).trim().slice(0, 120) : atual[i];
      const js = op.dados != null ? JSON.stringify(op.dados) : null;
      if (js && js.length > 49000) throw new Error('Registro grande demais para a planilha: encurte os textos.');
      const d = op.data != null && dataOk(String(op.data)) ? String(op.data) : atual[2];
      const linha = [id, txt(op.modulo, 1), d, txt(op.tipo, 3), js != null ? js : atual[4], txt(op.status, 5), atual[6] || quem, atual[7] || agora, quem, agora];
      if (!linha[1] || !linha[2]) continue;
      if (k != null) R2[k] = linha; else { iR2.set(id, R2.length); R2.push(linha); }
      mudou.R2 = true;
    } else if (op.t === 'reg2Del') {
      const id = String(op.id || ''); if (!iR2.has(id)) continue;
      R2 = R2.filter(r => String(r[0]) !== id); iR2 = indice(R2, r => String(r[0]));
      mudou.R2 = true;
    } else if (op.t === 'ativDel') {
      const id = String(op.id || ''); if (!iAt.has(id)) continue;
      At = At.filter(r => String(r[0]) !== id); iAt = indice(At, r => String(r[0]));
      mudou.At = true;
    } else if (op.t === 'base') {
      regravar(aba('Itens'), ABAS.Itens.length, op.itens || []);
      itens.clear(); (op.itens || []).forEach(r => itens.set(String(r[0]), r));
    } else if (op.t === 'substituir') {
      // importação da planilha com lançamentos: troca semanas e lançamentos inteiros
      S.length = 0; idxS.clear();
      (op.semanas || []).forEach(w => { idxS.set(Number(w.n), S.length); S.push([w.n, w.ini, w.fim, w.periodo, w.arm, w.dias]); });
      L.length = 0; idxL.clear();
      (op.lanc || []).forEach(([sem, cod, qtd]) => {
        if (!itens.has(String(cod)) || !(qtd > 0)) return;
        idxL.set(sem + '|' + cod + '|' + eqPad, L.length);
        L.push(linhaLanc(sem, String(cod), qtd, eqPad));
      });
      mudou.L = mudou.S = true;
    }
  }
  if (mudou.S) { S.sort((a, b) => a[0] - b[0]); regravar(aba('Semanas'), ABAS.Semanas.length, S); }
  if (mudou.L) regravar(aba('Lancamentos'), ABAS.Lancamentos.length, L);
  if (mudou.E) regravar(aba('Equipes'), ABAS.Equipes.length, E);
  if (mudou.R) regravar(aba('Registros'), ABAS.Registros.length, R);
  if (mudou.El) regravar(aba('Elementos'), ABAS.Elementos.length, El);
  if (mudou.Cf) regravar(aba('Config'), ABAS.Config.length, Cf);
  const porData = (a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  if (mudou.Ef) regravar(aba('Efetivo'), ABAS.Efetivo.length, Ef.slice().sort((a, b) => a[5] - b[5]));
  if (mudou.Dia) regravar(aba('EfetivoDia'), ABAS.EfetivoDia.length, Dia.filter(Boolean).sort(porData));
  if (mudou.Pe) regravar(aba('Pessoas'), ABAS.Pessoas.length, Pe.slice().sort((a, b) => String(a[1]).localeCompare(String(b[1]))));
  if (mudou.Pr) regravar(aba('Presencas'), ABAS.Presencas.length, Pr.filter(Boolean).sort(porData));
  if (mudou.At) regravar(aba('Atividades'), ABAS.Atividades.length, At);
  if (mudou.Rd) regravar(aba('RDO'), ABAS.RDO.length, Rd.sort(porData));
  if (mudou.Cc) regravar(aba('Concretagens'), ABAS.Concretagens.length, Cc.slice().sort((a, b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  if (mudou.Tr) { if (apagaTr) regravar(aba('ConcretagemTracos'), ABAS.ConcretagemTracos.length, Tr.filter(Boolean)); else acrescentar_(aba('ConcretagemTracos'), ABAS.ConcretagemTracos.length, novosTr); }
  if (mudou.R2) regravar(aba('Registros2'), ABAS.Registros2.length, R2.slice().sort((a, b) => a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0));

  // histórico: uma linha por alteração (importação grande vira uma linha só)
  const nomeDe = (L, id, col) => { const r = L.find(x => x && String(x[0]) === String(id)); return r ? String(r[col]) : String(id || ''); };
  const desc = op => {
    switch (op.t) {
      case 'lanc': return ['Aço: lançamento', 'Semana ' + op.sem + ' · ' + op.cod + ' · ' + op.qtd + ' barras · ' + (op.equipe || '')];
      case 'sem': return ['Aço: semana', 'Semana ' + op.n + (op.arm != null ? ' · armadores ' + op.arm : '') + (op.dias != null ? ' · dias ' + op.dias : '')];
      case 'equipe': return ['Aço: equipe', String(op.nome)];
      case 'reg': return [op.tipo === 'ocorrencia' ? 'Ocorrência' : 'Observação', (op.data || '') + ' · ' + (op.cod || '') + ' · ' + String(op.texto || '').slice(0, 150)];
      case 'regDel': return ['Registro apagado', String(op.id)];
      case 'foto': return ['Foto', (op.cod || '') + ' · ' + String(op.texto || '').slice(0, 100)];
      case 'elem': return ['Frente de serviço', String(op.chave)];
      case 'config': return ['Configuração', op.chave + ' = ' + String(op.valor).slice(0, 100)];
      case 'funcao': return ['Efetivo: quadro', (op.empresa || nomeDe(Ef, op.id, 1)) + ' · ' + (op.funcao || nomeDe(Ef, op.id, 2)) + (op.ativo === false ? ' (desativada)' : '')];
      case 'funcaoDel': return ['Efetivo: função excluída', String(op.id)];
      case 'dia': return ['Efetivo do dia', op.data + ' · ' + nomeDe(Ef, op.id, 2) + ' · ' + (op.v ? 'turma ' + op.v[0] + ', faltas ' + op.v[1] : 'apagado')];
      case 'pessoa': return ['Efetivo: cadastro', op.nome || nomeDe(Pe, op.id, 1)];
      case 'pessoaDel': return ['Efetivo: pessoa excluída', String(op.id)];
      case 'pres': return ['Presença', op.data + ' · ' + nomeDe(Pe, op.id, 1) + ' · ' + (op.st === 'P' ? 'OK' + (op.hora ? ' ' + op.hora : '') : SITUACOES[op.st] || 'desmarcado')];
      case 'ativ': return ['Produção', (op.atividade || nomeDe(At, op.id, 1)) + ' · ' + (op.logs || []).map(l => l.txt).join(' | ')];
      case 'ativDel': return ['Produção: atividade excluída', String(op.id)];
      case 'conc': return ['Concretagem', (op.estrutura || nomeDe(Cc, op.id, 2)) + ' · ' + (op.local || nomeDe(Cc, op.id, 3)) + (op.log ? ' · ' + op.log : '')];
      case 'concDel': return ['Concretagem excluída', String(op.id)];
      case 'ccTraco': return ['Concretagem: área pintada', 'caminhão ' + op.cam + ' · folha ' + op.pag + ' · ' + nomeDe(Cc, op.conc, 2)];
      case 'ccTracoDel': return ['Concretagem: área apagada', String(op.id)];
      case 'rdo': return ['RDO', op.data + (op.status === 'Fechado' ? ' · fechado' : op.status === 'Rascunho' ? ' · reaberto' : ' · editado') + (op.log ? ' · ' + op.log : '')];
      case 'reg2': return [(NOMES_REG2[op.modulo] || String(op.modulo || nomeDe(R2, op.id, 1))) + (op.tipo ? ': ' + op.tipo : ''), String(op.data || '') + (op.status ? ' · ' + op.status : '') + (op.log ? ' · ' + op.log : '')];
      case 'reg2Del': return ['Registro excluído', String(op.id)];
      case 'base': return ['Base de itens', (op.itens || []).length + ' itens'];
      case 'substituir': return ['Importação de lançamentos', (op.lanc || []).length + ' lançamentos'];
      default: return [String(op.t), ''];
    }
  };
  const log = ops.length > 300
    ? [[agora, nomeU || 'sem login', cargoU, 'Importação', ops.length + ' alterações de uma vez (' + [...new Set(ops.map(o => o.t))].join(', ') + ')']]
    : ops.map(op => { const [acao, det] = desc(op); return [agora, nomeU || 'sem login', cargoU, acao, String(det).slice(0, 500)]; });
  if (log.length) {
    const sh = aba('Historico'), ini = sh.getLastRow() + 1;
    sh.getRange(ini, 2, log.length, 4).setNumberFormat('@');
    sh.getRange(ini, 1, log.length, 5).setValues(log);
  }
}

function regravar(sh, cols, dados) {
  const atual = sh.getLastRow() - 1;
  if (atual > 0) sh.getRange(2, 1, atual, cols).clearContent();
  if (!dados.length) return;
  // colunas de código em formato texto ANTES de gravar, para o Planilhas não converter em data/número
  for (const c of (COLS_TEXTO[sh.getName()] || [])) sh.getRange(2, c + 1, Math.max(dados.length, atual, 1), 1).setNumberFormat('@');
  const texto = new Set(COLS_TEXTO[sh.getName()] || []);
  sh.getRange(2, 1, dados.length, cols).setValues(dados.map(r => r.map((v, c) => texto.has(c) && v !== '' && v != null ? String(v) : v)));
}

// Regrava as abas com os códigos como texto (conserta os que o Planilhas converteu em data).
function repararCodigos() {
  for (const nome of ['Itens', 'Lancamentos', 'Registros', 'Equipes']) regravar(aba(nome), ABAS[nome].length, linhas(nome));
}

// Rodar UMA vez no editor do Apps Script: põe o "N" nas posições da aba Itens lançadas só com o número (ex.: "4" → "N4",
// como nas paredes 11 e 12 do decantador). Mexe só na coluna POSICAO; o resto da linha fica igual. Fica registrado no Historico.
// (O app v84 já lê essas posições com o N; isto deixa a planilha igual ao que o app mostra.)
function corrigirPosicoesSemN() {
  const sh = aba('Itens'), n = sh.getLastRow() - 1, col = ABAS.Itens.indexOf('POSICAO') + 1;
  if (n < 1 || col < 1) return Logger.log('Aba Itens vazia ou sem a coluna POSICAO.');
  const rg = sh.getRange(2, col, n, 1), v = rg.getValues(), cods = sh.getRange(2, 1, n, 1).getValues(), mud = [];
  const novo = v.map((r, k) => { const s = String(r[0] == null ? '' : r[0]).trim();
    if (/^\d/.test(s)) { mud.push(cods[k][0] + ': ' + s + ' → N' + s); return ['N' + s]; } return [r[0]]; });
  if (!mud.length) return Logger.log('Nenhuma posição sem N.');
  rg.setNumberFormat('@'); rg.setValues(novo);
  logAcesso_('Apps Script', '', 'Posições sem N corrigidas', mud.length + ' posições: ' + mud.join(' · '));
  Logger.log(mud.length + ' posições corrigidas:\n' + mud.join('\n'));
}
