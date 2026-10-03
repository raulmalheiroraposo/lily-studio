# Monaco Editor e estilos em arquivos CSS

## Objetivo
Substituir todos os usos do CodeMirror pelo Monaco Editor e permitir que páginas usem arquivos CSS criados, selecionados e editados dentro do Lily Studio.

## Implementação
- Adicionar o tipo de arquivo **Estilo CSS**, com pasta padrão `estilos`, ícone próprio, criação pela árvore, abertura de arquivos `.css` e suporte a Salvar/Salvar Como/exportação.
- Permitir vincular um arquivo CSS à página ativa pela aba **Estilo** do painel direito, mesmo quando nenhum componente estiver selecionado.
- Na aba **Estilo**, oferecer seleção do CSS existente, criação rápida de um novo arquivo e abertura do arquivo escolhido no editor.
- Aplicar o CSS vinculado ao canvas, ao Preview, à página aberta em nova aba e ao site gerado/exportado.
- Gerar referências `<link rel="stylesheet">` nas páginas exportadas e incluir os arquivos CSS no ZIP e na gravação local, preservando a edição visual dos estilos de cada bloco.
- Substituir o CodeMirror pelo Monaco no editor modal e no editor de scripts/estilos, com seletores visíveis de linguagem e tema.
- Detectar a linguagem inicial pela extensão do arquivo, mantendo a opção de alterá-la manualmente; disponibilizar temas claro, escuro e alto contraste.
- Atualizar o manual com arquivos CSS, vínculo por página e os controles do Monaco.

## Detalhes técnicos
- Ampliar `ProjectFile` para aceitar `style` e guardar em páginas o identificador do CSS vinculado.
- Centralizar a resolução de linguagem por nome/extensão para HTML, CSS, JavaScript, TypeScript e JSON.
- Carregar o Monaco somente no navegador para manter a renderização inicial compatível com o aplicativo web e desktop.
- Manter a sincronização atual entre HTML/TSX e blocos; estilos individuais continuam editáveis e o CSS externo passa a complementar essa camada.

## Verificação
- Criar um CSS pela árvore, editá-lo no Monaco, vinculá-lo à página e confirmar a alteração no canvas/Preview.
- Confirmar seleção de tema e linguagem no editor.
- Abrir e salvar `.css`, exportar o projeto e verificar que HTML e ZIP referenciam e incluem o arquivo correto.
- Conferir o editor em tela larga e estreita, executar a checagem de tipos e validar que o aplicativo abre sem erros.
