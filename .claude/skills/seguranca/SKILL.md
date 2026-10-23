---
name: seguranca
description: Auditoria de segurança do Wigo (app, painel, Apps Script e publicação), com prova de cada achado. Use quando pedirem "revisão de segurança", "auditoria", "isso é seguro?", antes de liberar o app para mais gente, ou quando mexer em permissões, acessos, chaves ou no doPost/doGet.
---

# Segurança do Wigo

Adaptado do `/cso` do gstack (MIT, Garry Tan): **prova antes de garantia.** Só entra no relatório o achado com
atacante, fronteira atravessada e impacto concretos. Análise estática: não rode nada contra a planilha de verdade.

## 1. Mapa do sistema
- **Atores**: pessoa sem acesso; celular com a senha do app mas não liberado; usuário liberado de cada cargo; Desenvolvedor; quem tem a chave de leitura (painel, Power BI).
- **Bens**: planilha (lançamentos, ponto, nomes do pessoal), fotos no Drive, Propriedades do script (`TOKEN`, chaves de API), secrets de FTP do GitHub.
- **Entradas**: `doPost` (`acao`, `ops`), `doGet` (`?k=`), `?equip=` e outros parâmetros de URL, arquivos importados (PDF de laudo, XLSX, fotos), iframe das Ferramentas.

## 2. Pontos a conferir (nesta ordem)
1. **Permissão só no navegador.** `aplicarPermissoes()`, `pode()`, `podeLanc()`, `CARGOS`, `PERMISSOES` rodam no celular.
   Para cada `ops` que `aplicar()` grava em `Code.gs`, o script confere o cargo de `conferirAcesso_` antes de gravar?
   Se não, um usuário liberado de qualquer cargo grava ou apaga o que quiser pelo console. Prove mostrando o caminho `doPost → aplicar` sem checagem.
2. **Ações de Dev**: `acessos`, `acessoDecidir`, `devDados`, `devChat` exigem `ehDevLiberado_` no servidor (não só `souDev()` no app).
3. **Chave de leitura**: o que `doGet` entrega com `?k=`; está embutida no painel público (`window.PAINEL_ACESSO`)? O que sai por ela (nomes do pessoal não devem sair).
4. **`TOKEN` do app**: está no código público do `index.html`? Se sim, o que protege é só `conferirAcesso_` (celular liberado); confira que ele vem antes de toda ação exceto `acesso`/`dev`.
5. **XSS**: `innerHTML` com texto que veio da planilha, de PDF ou de parâmetro de URL. Texto de usuário deve ir por `textContent`/`el()`.
6. **Arquivos do Drive**: `lerPdf`, `miniatura` só abrem arquivos das pastas certas (como `miniatura` confere a pasta Fotos).
7. **Publicação**: `exclude` do FTP em `.github/workflows/publicar-hostgator.yml` cobre `.git*`, `.github`, `tests`, `apps-script`, `.claude`;
   nada de chave em commit (`git log -p -S "AKfycb"`, `-S "sk-ant"`, `-S "AIza"`); ações do GitHub com versão fixa.
8. **Bibliotecas de CDN**: versão exata em todas (jsdelivr, cdnjs, cdn.sheetjs.com); nenhuma "latest".
9. **Cabeçalhos**: `.htaccess` com `X-Frame-Options SAMEORIGIN`; o app só abre iframe da mesma origem.

## 3. Desafio de cada achado
Antes de reportar, procure o que derruba o achado: uma checagem em outra função, o embrulho de uma função, a ordem no `doPost`.
Se houver subagente disponível, peça a ele para tentar refutar, sem contar a sua conclusão. Sem prova = hipótese, em lista separada.

## 4. Relatório
Comece com **completo**, **parcial** ou **não avaliado** e o que ficou de fora.

| ID | Gravidade | Confiança | Onde (arquivo:linha) | Quem explora e como | Impacto | Correção sugerida |
|----|-----------|-----------|----------------------|---------------------|---------|-------------------|

Sem achados: escreva "Nenhum achado comprovado no que foi avaliado." Correções viram commits separados e são publicadas com o skill `publicar`
(mudança no `Code.gs` também precisa de Nova versão no Apps Script).
