# Plano: Painel Dev, segunda leva (out/2026)

Pedido do Wiliam (Junin12) em 22/10/2026: fazer todas as sugestões abaixo no Painel Dev do WIGO.
Regras do projeto: commits em nome de Junin12; publicar direto no `main` (o GitHub testa e publica
na HostGator); subir `VERSAO` em `sw.js` e `VERSAO_APP` em `index.html` juntos; o script da planilha
(`apps-script/Code.gs`) é publicado à mão no Apps Script (Implantar › Gerenciar implantações › lápis ›
Nova versão) no projeto "CAU - Armação".

Onde está o Painel Dev: `index.html`, bloco que começa em `// ================= Painel Dev`.
Módulo `MOD2.dev` (`render: renderDev`), abas em `ABAS_DEV`, permissões em `FUNCOES` / `aplicarPermissoes()`
(chave `PERMISSOES` na aba Config), registro de mudanças em `logDev()` (reg2 `dev/mudanca`).

**Situação (22/10/2026): tudo feito no app v144 e no script 34 (com o vigia no Extras.gs).**

## Itens (marque ao terminar)
- [x] **Ver como outro cargo**: o Desenvolvedor usa o app com as permissões de outro cargo, sem trocar o login.
  `cargoEf()` no lugar de `U.cargo` em `pode`, `podePdf`, `veDash`, `podeMod`; `souDev()` continua pelo cargo real.
  Faixa no topo "Vendo como X · Sair". O que gravar vai com o nome real.
- [x] **Aparelhos**: aba com cada celular (versão, última sincronização, pendências) a partir de `post({acao:"acessos"})`.
- [x] **Tamanho da planilha**: `devDados` (script 34) devolve `abas: [{nome, linhas, colunas}]`; alerta por aba grande.
- [x] **Aviso geral**: chave `AVISO_GERAL` ({texto, cargos[], ate}) → faixa no início para os cargos escolhidos.
- [x] **Modo manutenção**: chave `MANUTENCAO` ({funcao: texto}) → a função fica "🔧 em manutenção" para todos menos o Dev.
- [x] **Novidades**: chave `NOVIDADES` ({versao, texto}) → cada usuário vê uma vez.
- [x] **Desfazer** na aba Mudanças: restaura registro apagado (campo `apagado`) e desfaz "Voltou lançamento de aço".
- [x] **Auditoria de permissões**: na aba Permissões, alerta função que ninguém (fora o Dev) pode editar.
- [x] **Pacote para o Claude**: um botão que junta diagnóstico + mudanças pendentes + erros + aparelhos + permissões.
- [x] **Chat do Claude** (aba "Claude"): script 34 ganha `acao: 'devChat'` (só Dev) que repassa à API da Anthropic
  com a chave `ANTHROPIC_API_KEY` das Propriedades do script. Ferramentas executadas no app: leitura automática
  (diagnóstico, avisos, histórico, permissões, aparelhos); escrita só com "Confirmar" (mudar permissão, marcar
  resolvido, apagar registro, voltar lançamento de aço, correções do diagnóstico), sempre registradas em `logDev`.
- [x] **Vigia diário** (`Extras.gs`): `vigiaDiaria()` confere erros das últimas 24 h, avisos abertos, celulares com
  pendências antigas e tamanho das abas, e manda e-mail ao desenvolvedor; `instalarVigia()` cria o gatilho diário
  (rodar uma vez no editor e autorizar o envio de e-mail).

## Pendente: RDO por voz com Gemini (22/10/2026, fim da sessão)
- Script 35 publicado (implantação "Version 37"; a cabeça do projeto tem o commit 656cf7f) com `GEMINI_API_KEY` já
  cadastrada pelo Wiliam. `geminiModelos_()` lista os Flash da chave (estáveis primeiro, do mais novo) e
  `geminiJson_()` tenta o próximo modelo quando um dá 503/429/5xx.
- Problema visto: o modelo escolhido foi `gemini-3.8-flash`; um pedido curto voltou 503 ("high demand") em 0,4 s,
  mas o pedido do RDO (com `responseSchema`) ficou mais de 100 s sem resposta, duas vezes.
- Próximos passos: (1) no editor, rodar `testeRdoGemini` (está no fim do Extras.gs, só na cabeça do projeto, não
  publicado) depois de criar a propriedade `GEMINI_MODELO` com um modelo estável mais antigo (ver a lista no log de
  `geminiModelos_`) e medir o tempo; (2) se o problema for o esquema, mandar sem `responseSchema` (JSON no texto) ou
  desligar o raciocínio (`thinkingConfig`) e confirmar o nome do campo na documentação do Google; (3) garantir que o
  pedido do app não espera mais que ~25 s (o app desiste antes); (4) publicar nova versão e apagar `testeRdoGemini`.
- Commit da versão que funcionar: publicar no Apps Script (puxar o arquivo de raw.githubusercontent.com no editor) e
  atualizar o LEIA-ME.
