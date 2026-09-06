# Lily Studio — plataforma no-code (React + TypeScript)

Editor visual com paleta de componentes HTML/CSS/gráficos, painel de propriedades,
atributos dinâmicos, eventos vinculados a funções de scripts ou URLs, e editor de
código com realce de sintaxe (CodeMirror).

## Recursos

- **Arquivos**: páginas, componentes e scripts (`.js`)
- **Paleta**: div, section, heading, paragraph, button, input, image, link, gráficos (barra/linha/pizza) e bloco React
- **Canvas**: blocos móveis e redimensionáveis (react-rnd)
- **Propriedades**: Props, Attrs (atributos HTML dinâmicos), Estilo e Eventos
- **Eventos**: chamam uma função de um script ou uma URL (GET/POST/PUT/DELETE/PATCH)
- **Editor de código**: CodeMirror com realce para JS/TS/HTML/CSS/JSON
- **Preview**: executa os eventos de verdade
- **Persistência**: automática no navegador + importar/exportar JSON

## Rodando localmente

```bash
bun install
bun run dev
```

Acesse `http://localhost:8080`. O manual de uso completo está em `/manual`.

## Stack

React 19, TypeScript, TanStack Start, Vite 7, Tailwind CSS v4, Zustand, CodeMirror, Recharts, react-rnd.
