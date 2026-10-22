# Plano: Painel Dev, segunda leva (out/2026)

Pedido do Wiliam (Junin12) em 22/10/2026: fazer todas as sugestões abaixo no Painel Dev do WIGO.
Regras do projeto: commits em nome de Junin12; publicar direto no `main` (o GitHub testa e publica
na HostGator); subir `VERSAO` em `sw.js` e `VERSAO_APP` em `index.html` juntos; o script da planilha
(`apps-script/Code.gs`) é publicado à mão no Apps Script (Implantar › Gerenciar implantações › lápis ›
Nova versão) no projeto "CAU - Armação".

Onde está o Painel Dev: `index.html`, bloco que começa em `// ================= Painel Dev`.
Módulo `MOD2.dev` (`render: renderDev`), abas em `ABAS_DEV`, permissões em `FUNCOES` / `aplicarPermissoes()`
(chave `PERMISSOES` na aba Config), registro de mudanças em `logDev()` (reg2 `dev/mudanca`).

## Itens (marque ao terminar)
- [ ] **Ver como outro cargo**: o Desenvolvedor usa o app com as permissões de outro cargo, sem trocar o login.
  `cargoEf()` no lugar de `U.cargo` em `pode`, `podePdf`, `veDash`, `podeMod`; `souDev()` continua pelo cargo real.
  Faixa no topo "Vendo como X · Sair". O que gravar vai com o nome real.
- [ ] **Aparelhos**: aba com cada celular (versão, última sincronização, pendências) a partir de `post({acao:"acessos"})`.
- [ ] **Tamanho da planilha**: `devDados` (script 34) devolve `abas: [{nome, linhas, colunas}]`; alerta por aba grande.
- [ ] **Aviso geral**: chave `AVISO_GERAL` ({texto, cargos[], ate}) → faixa no início para os cargos escolhidos.
- [ ] **Modo manutenção**: chave `MANUTENCAO` ({funcao: texto}) → a função fica "🔧 em manutenção" para todos menos o Dev.
- [ ] **Novidades**: chave `NOVIDADES` ({versao, texto}) → cada usuário vê uma vez.
- [ ] **Desfazer** na aba Mudanças: restaura registro apagado (campo `apagado`) e desfaz "Voltou lançamento de aço".
- [ ] **Auditoria de permissões**: na aba Permissões, alerta função que ninguém (fora o Dev) pode editar.
- [ ] **Pacote para o Claude**: um botão que junta diagnóstico + mudanças pendentes + erros + aparelhos + permissões.
- [ ] **Chat do Claude** (aba "Claude"): script 34 ganha `acao: 'devChat'` (só Dev) que repassa à API da Anthropic
  com a chave `ANTHROPIC_API_KEY` das Propriedades do script. Ferramentas executadas no app: leitura automática
  (diagnóstico, avisos, histórico, permissões, aparelhos); escrita só com "Confirmar" (mudar permissão, marcar
  resolvido, apagar registro, voltar lançamento de aço, correções do diagnóstico), sempre registradas em `logDev`.
- [ ] **Vigia diário** (`Extras.gs`): `vigiaDiaria()` confere erros das últimas 24 h, avisos abertos, celulares com
  pendências antigas e tamanho das abas, e manda e-mail ao desenvolvedor; `instalarVigia()` cria o gatilho diário
  (rodar uma vez no editor e autorizar o envio de e-mail).
