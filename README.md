# Contagem de Estoque – Info Soluções

App web (PWA) para contagem de estoque com leitura de código de barras, compatível com a Conferência de Estoque do Clipp (substitui o plugin pago "Confere Estoque").

Endereço: https://prstrei-hub.github.io/contagem-estoque/

## Como usar
1. **No Clipp:** Estoque › Conferência de Estoque › coloque os produtos na lista › **Exportar**. Para ler código de barras, marque **Código de Barras** como identificador. Deixe "Quantidade em Estoque" marcada para ver a diferença.
2. Envie o arquivo `.json` para o celular (WhatsApp, cabo etc.).
3. **No celular (Chrome):** abra o endereço acima › **Carregar arquivo do Clipp**. Para instalar, use o menu do Chrome › "Adicionar à tela inicial".
4. Conte:
   - **📷 Ler código** usa a câmera. Com **Lançamento rápido** ligado, cada leitura soma +1. Desligado, você digita a quantidade (aceita vírgula, ex.: 1,5) e escolhe Somar ou Substituir.
   - Também dá para digitar o código no campo e tocar em OK. Toque num item da lista para corrigir.
   - Itens que não estão na lista são aceitos e aparecem como "fora da lista".
   - Sem arquivo, use **Lançamento manual**.
5. **📤 Exportar** › Compartilhar (WhatsApp) ou "Só baixar o arquivo". Por padrão **só os itens contados** são exportados.
6. **No Clipp:** Conferência de Estoque › **Importar** › **Importação via arquivo** › selecione o arquivo. Confira a "Qtd Coletada" antes de clicar em **Atualizar cadastros**.

O progresso fica salvo no celular, mesmo se você fechar o navegador. Para começar outra contagem, use o menu ⋯ › Nova contagem.

## Pontos fracos
- Testado só a importação por **código do produto**. A importação por código de barras ou referência no Clipp ainda não foi testada.
- Itens "fora da lista" (código que não existe no Clipp) podem ser recusados ou ignorados pelo Clipp na importação.
- Atualizações do Clipp podem mudar o formato do arquivo, então teste de novo a cada versão.
- A leitura pela câmera depende do celular. No Chrome Android usa o leitor nativo, e nos outros navegadores usa o ZXing, que é mais lento. Códigos amassados ou com pouca luz podem falhar, e nesse caso é só digitar.
- Os dados ficam só no navegador do celular. Se você limpar os dados do Chrome, perde a contagem em andamento. Não há sincronização entre vários celulares.
- Opção "incluir não contados como 0": se você atualizar os cadastros depois, o estoque desses itens é zerado. Use só se tiver certeza.

## Desenvolvimento
- `node test/core.test.js`: testa leitura do arquivo, contagem e formato de exportação.
- `test/e2e.js`: teste no navegador com Playwright e bwip-js, rodando um servidor local na porta 8765.
- `vendor/zxing.min.js`: @zxing/library 0.21.3 (Apache-2.0), incluído localmente.
