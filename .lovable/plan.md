
# Plataforma No-Code Visual (React + TypeScript)

Vou construir uma plataforma no-code completa dentro deste projeto Lovable (TanStack Start + React + TS), com editor visual drag-and-drop, editor de fluxos (fluxograma), editor de código com CodeMirror, e persistência de projeto.

## Escopo funcional

1. **Editor visual (Canvas)**
   - Paleta lateral de componentes: HTML básicos (div, section, heading, parágrafo, botão, input, imagem, link), CSS (containers estilizáveis, grid, flex), e gráficos (bar, line, pie via Recharts).
   - Componentes React customizados aparecem como blocos/containers editáveis.
   - Drag-and-drop para adicionar; mover e redimensionar via handles (react-rnd).
   - Seleção com outline e painel de propriedades.

2. **Editor de propriedades e eventos**
   - Painel lateral direito com abas: Propriedades (texto, estilos, classes, atributos) e Eventos (onClick, onChange, onLoad, onMouseEnter, etc.).
   - Cada evento pode ser vinculado a um **Fluxo** existente (dropdown) ou criar novo.

3. **Editor de Fluxos (Fluxograma)**
   - Container visual com nós conectáveis usando **@xyflow/react** (React Flow).
   - Tipos de nó (ações):
     - Função customizada (código JS/TS)
     - Requisição HTTP (URL de site/API — GET/POST/etc.)
     - Laço (for/while, iteração sobre lista)
     - Controle (if/else, switch)
     - Início / Fim
   - Adicionar/remover nós, conectar em sequência, reordenar.
   - Executor de fluxo em runtime (interpretador simples que segue as arestas).

4. **Editor de código (CodeMirror 6)**
   - Botão + menu de contexto em qualquer componente React ou nó de ação abre modal/painel com CodeMirror.
   - Realce de sintaxe: HTML, CSS, JS/TS, JSON.
   - Salva de volta no componente/ação.

5. **Gerenciamento de arquivos do projeto**
   - Árvore de arquivos (páginas HTML, componentes React, scripts de ação).
   - Ações: novo, renomear, deletar, abrir, salvar.
   - Persistência em `localStorage` (client-only, sem backend nesta v1) + botões Exportar/Importar JSON do projeto inteiro.

6. **Manual de uso**
   - Rota `/manual` com documentação passo-a-passo (criar página, arrastar componente, editar props, criar fluxo, ligar evento, editar código, salvar/exportar).

7. **GitHub**
   - No Lovable, o sync com GitHub é feito pelo usuário via menu (+) → GitHub → Connect project. Vou deixar instruções no manual e uma seção no README explicando o passo. Não posso conectar o GitHub por você programaticamente.

## Arquitetura técnica

```text
src/
  routes/
    __root.tsx           # shell + header nav
    index.tsx            # tela do editor (canvas + paletas)
    manual.tsx           # manual de uso
  components/
    editor/
      Canvas.tsx         # área de edição visual
      ComponentPalette.tsx
      PropertiesPanel.tsx
      EventsPanel.tsx
      FileTree.tsx
      CodeEditorModal.tsx  # CodeMirror wrapper
    flow/
      FlowEditor.tsx     # React Flow container
      nodes/
        FunctionNode.tsx
        HttpNode.tsx
        LoopNode.tsx
        ControlNode.tsx
        StartEndNode.tsx
    blocks/              # renderers dos componentes visuais
      HtmlBlock.tsx
      ChartBlock.tsx
      ReactBlock.tsx
  lib/
    project-store.ts     # Zustand store: files, components, flows, selection
    flow-runtime.ts      # interpretador de fluxos
    persistence.ts       # localStorage + import/export
    types.ts
```

**Bibliotecas a adicionar:** `@xyflow/react`, `react-rnd`, `@uiw/react-codemirror`, `@codemirror/lang-javascript`, `@codemirror/lang-html`, `@codemirror/lang-css`, `@codemirror/lang-json`, `zustand`, `recharts` (verificar se já vem), `lucide-react` (já vem).

**Sem backend nesta versão** — tudo client-side, persistência em `localStorage`. Se depois quiser projetos multi-usuário / salvar na nuvem, ativo Lovable Cloud numa segunda etapa.

## Design

Tema dark tipo IDE (VS Code / Framer), tokens semânticos no `src/styles.css`. Layout de 3 colunas: paleta+arquivos à esquerda, canvas central, propriedades+eventos à direita. Barra superior com abas de arquivo aberto e botão "Executar/Preview". Editor de fluxo abre em painel inferior recolhível ou modal cheio.

## Fora do escopo (v1)

- Multi-usuário e salvar em servidor remoto.
- Geração de código React exportável do projeto criado no editor (posso adicionar depois — v1 salva/carrega JSON do projeto).
- Deploy automático dos projetos criados dentro do editor.
- Conexão automática ao GitHub (usuário faz pelo menu + do Lovable).

Se aprovar, começo pela base (store + layout + paleta + canvas) e vou empilhando fluxos, propriedades e CodeMirror.
