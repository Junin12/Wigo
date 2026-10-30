// Provedor do promptfoo para o RDO por voz: monta o pedido com a MESMA função do Apps Script (pedidoRdo_ do Code.gs)
// e chama a API do Claude daqui do computador. Assim o teste confere o prompt que vai para o ar, sem cópia.
// Precisa da variável ANTHROPIC_API_KEY (a mesma chave das Propriedades do script).
const fs = require('fs'), path = require('path'), vm = require('vm');

const codigo = fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', 'Code.gs'), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(codigo + '\nthis.pedidoRdo_ = pedidoRdo_;', ctx);

module.exports = class RdoVoz {
  id() { return 'wigo-rdo-voz'; }
  async callApi(prompt, { vars }) {
    const chave = process.env.ANTHROPIC_API_KEY;
    if (!chave) return { error: 'Defina ANTHROPIC_API_KEY antes de rodar os testes.' };
    const corpo = { texto: prompt, data: vars.data || '2026-10-30', contexto: JSON.parse(vars.contexto || '{}') };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
      body: JSON.stringify(ctx.pedidoRdo_(corpo)),
    });
    const j = await r.json();
    if (!r.ok) return { error: 'HTTP ' + r.status + ': ' + ((j.error && j.error.message) || '') };
    const bloco = (j.content || []).find(b => b.type === 'text');
    return { output: bloco ? bloco.text : '', tokenUsage: { prompt: j.usage?.input_tokens, completion: j.usage?.output_tokens } };
  }
};
