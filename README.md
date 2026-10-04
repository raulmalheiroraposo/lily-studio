# Lily Studio — plataforma no-code (React + TypeScript)

Editor visual com paleta de componentes HTML/CSS/gráficos, painel de propriedades,
atributos dinâmicos, eventos vinculados a funções de scripts ou URLs, e editor de
código no Monaco Editor com seleção de linguagem e tema.

## Recursos

- **Arquivos**: páginas, componentes, scripts (`.js`) e estilos (`.css`)
- **Paleta**: div, section, heading, paragraph, button, input, image, link, gráficos (barra/linha/pizza) e bloco React
- **Canvas**: blocos móveis e redimensionáveis (react-rnd)
- **Propriedades**: Props, Attrs (atributos HTML dinâmicos), Estilo e Eventos
- **Eventos**: chamam uma função de um script ou uma URL (GET/POST/PUT/DELETE/PATCH)
- **Editor de código**: Monaco Editor com linguagem e tema selecionáveis para JS/TS/HTML/CSS/JSON
- **CSS externo**: criação de folhas de estilo e vínculo a páginas pelo painel Estilo
- **Preview**: executa os eventos de verdade
- **Persistência**: automática no navegador + importar/exportar JSON

## Rodando localmente

```bash
bun install
bun run dev
```

Acesse `http://localhost:8080`. O manual de uso completo está em `/manual`.

## Stack

React 19, TypeScript, TanStack Start, Vite 7, Tailwind CSS v4, Zustand, Monaco Editor, Recharts, react-rnd.
