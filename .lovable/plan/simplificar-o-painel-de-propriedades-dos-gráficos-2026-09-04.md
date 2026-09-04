# Simplificar o painel de propriedades dos gráficos

## Problema
No painel de propriedades de um bloco de gráfico (`chart-bar`, `chart-line`, `chart-pie`) aparecem duas "fontes de dados":
- Aba **Props** → campo **Fonte de dados (JSON, URL ou função de script)**.
- Aba **Attrs** → atributo personalizado `data-source` (e, às vezes, `data-name-key` / `data-value-key`).

Isso confunde porque ambos controlam a mesma coisa: de onde o gráfico lê seus pontos.

## Diagnóstico
- O campo **Props > Fonte de dados** edita `block.props.dataSource` (e `nameKey` / `valueKey`). Esse é o valor autoritativo no modelo visual do editor.
- Quando o código HTML/TSX é gerado, o gerador converte esses props no atributo HTML `data-source` (e `data-name-key` / `data-value-key`) do componente `<FluxoChart>`.
- Ao importar código de volta, o `html-importer.ts` já lê `data-source` e atualiza `block.props.dataSource`, então a sincronização bidirecional funciona.
- O atributo `data-source` acaba aparecendo na seção **Attrs > Atributos personalizados**, dando a impressão de duplicação.

## O que será feito
1. **Esconder atributos gerenciados** — filtrar `data-source`, `data-name-key` e `data-value-key` da lista de "Atributos personalizados" quando o bloco for um gráfico. Eles continuam existindo no modelo, mas não serão editáveis em dois lugares ao mesmo tempo.
2. **Garantir sincronização** — manter o comportamento atual: editar em Props gera `data-source` no código; editar o código manualmente atualiza Props na importação.
3. **Melhorar o label** — trocar o label do campo Props para **Fonte de dados do gráfico** e manter o placeholder explicativo.

## Resultado esperado
Apenas um lugar no painel de propriedades controlará a fonte de dados dos gráficos, eliminando a confusão sem perder a flexibilidade de editar por código-fonte.
