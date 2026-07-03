import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual — FluxoStudio" },
      { name: "description", content: "Guia completo de uso da plataforma no-code FluxoStudio: canvas, componentes, fluxos, propriedades, eventos e editor de código." },
      { property: "og:title", content: "Manual — FluxoStudio" },
      { property: "og:description", content: "Como usar o editor visual, criar fluxos e editar código." },
    ],
  }),
  component: Manual,
});

function Manual() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-[color:var(--panel)] px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-xs hover:bg-accent">
            <ArrowLeft className="h-3 w-3" /> Voltar ao editor
          </Link>
          <h1 className="text-lg font-bold">Manual do FluxoStudio</h1>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10 prose-custom">
        <style>{`
          .prose-custom h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: .75rem; color: var(--foreground); }
          .prose-custom h3 { font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: .5rem; color: var(--foreground); }
          .prose-custom p, .prose-custom li { color: var(--muted-foreground); line-height: 1.65; }
          .prose-custom ol, .prose-custom ul { margin: .75rem 0 .75rem 1.5rem; }
          .prose-custom code { background: var(--card); padding: .1rem .35rem; border-radius: 4px; font-size: .85em; color: var(--foreground); }
          .prose-custom kbd { background: var(--card); border: 1px solid var(--border); padding: .05rem .35rem; border-radius: 4px; font-size: .75em; }
          .prose-custom hr { border-color: var(--border); margin: 2rem 0; }
        `}</style>

        <p className="text-lg text-muted-foreground">
          O <b className="text-foreground">FluxoStudio</b> é uma plataforma no-code para construir páginas HTML, componentes React e fluxos de ação de forma visual — arraste, edite, conecte e execute.
        </p>

        <h2>1. Interface</h2>
        <ul>
          <li><b>Barra superior:</b> nome do projeto, arquivo aberto, botões <i>Importar</i>, <i>Salvar/Exportar</i> e <i>Manual</i>.</li>
          <li><b>Painel esquerdo:</b> alterna entre <i>Arquivos</i> (páginas HTML, componentes React, ações) e <i>Componentes</i> (paleta HTML/CSS/Gráficos/React).</li>
          <li><b>Canvas central:</b> área de edição visual do arquivo aberto (drag &amp; resize).</li>
          <li><b>Painel de fluxo (inferior):</b> fluxograma editável da ação/fluxo em foco.</li>
          <li><b>Painel direito:</b> propriedades, estilo e eventos do componente selecionado.</li>
        </ul>

        <h2>2. Criando um arquivo</h2>
        <ol>
          <li>Em <i>Arquivos</i>, clique no <kbd>+</kbd> ao lado do grupo desejado:
            <ul>
              <li><b>Páginas HTML</b> — página do site montada com blocos HTML.</li>
              <li><b>Componentes React</b> — bloco reutilizável com código React.</li>
              <li><b>Ações (Fluxos)</b> — script que executa um fluxograma quando disparado.</li>
            </ul>
          </li>
          <li>Clique no arquivo para abri-lo no canvas.</li>
          <li>Renomeie e exclua pelos ícones ao lado do nome.</li>
        </ol>

        <h2>3. Adicionando componentes visuais</h2>
        <ol>
          <li>Abra uma <i>Página</i> ou <i>Componente</i>.</li>
          <li>Vá em <i>Componentes</i>, na paleta esquerda.</li>
          <li>Clique num componente (Div, Título, Botão, Input, Imagem, gráficos, bloco React etc.) para inseri-lo no canvas.</li>
          <li>No canvas: <b>arraste</b> para mover, <b>puxe as bordas</b> para redimensionar, <b>clique</b> para selecionar.</li>
          <li>Componentes React aparecem como blocos com preview do código-fonte.</li>
        </ol>

        <h2>4. Editando propriedades, estilo e eventos</h2>
        <p>Com um componente selecionado, o painel direito mostra três abas:</p>
        <ul>
          <li><b>Props:</b> texto, atributos (src, href, placeholder), largura/altura.</li>
          <li><b>Estilo:</b> background, color, border, borderRadius, padding, fontSize, fontWeight, textAlign — CSS puro.</li>
          <li><b>Eventos:</b> escolha um evento (<code>onClick</code>, <code>onChange</code> etc.) e vincule a um <b>Fluxo</b> existente ou clique em <i>novo fluxo</i> para criar na hora.</li>
        </ul>

        <h2>5. Editor de Fluxo (fluxograma)</h2>
        <p>Um fluxo é uma sequência de <b>componentes de ação</b> conectados por setas. Quando um evento acionado, o fluxo é executado do nó <i>Início</i> até o <i>Fim</i>.</p>
        <h3>Tipos de ação</h3>
        <ul>
          <li><b>Função</b> — bloco de código JavaScript (recebe <code>ctx</code>, retorna o novo <code>ctx</code>).</li>
          <li><b>HTTP</b> — chamada a uma URL (site ou API) com método GET/POST/PUT/DELETE/PATCH.</li>
          <li><b>Laço</b> — repete o próximo bloco N vezes.</li>
          <li><b>Se/Então</b> — avalia uma condição JS; usa saída <i>true</i> ou <i>false</i>.</li>
          <li><b>Início</b> / <b>Fim</b> — âncoras do fluxo (Início já vem criado).</li>
        </ul>
        <h3>Como montar</h3>
        <ol>
          <li>Escolha o fluxo na lista lateral ou crie um novo com <kbd>+</kbd>.</li>
          <li>Clique em um botão de <i>Adicionar nó</i> para inserir um bloco.</li>
          <li>Arraste dos <i>handles</i> (bolinhas) do nó de origem até o nó de destino para conectar.</li>
          <li>Clique num nó para editar rótulo, URL, método, condição, iterações etc. no painel lateral.</li>
          <li>Remova nós pelo botão <i>lixeira</i> do painel lateral.</li>
          <li>Clique em <b>Executar</b> para rodar o fluxo agora e ver o log passo-a-passo.</li>
        </ol>

        <h2>6. Editor de código-fonte (CodeMirror)</h2>
        <p>Para componentes <b>React</b> e para nós de <b>Função</b> nos fluxos há um botão <i>Editar código-fonte</i> / <i>Editar código</i>. Ele abre um editor com:</p>
        <ul>
          <li>Realce de sintaxe (JS/TS/JSX, HTML, CSS, JSON).</li>
          <li>Numeração de linhas, dobra de código, linha ativa.</li>
          <li>Botão <b>Salvar</b> grava o código no componente/ação.</li>
        </ul>

        <h2>7. Salvar, abrir e exportar</h2>
        <ul>
          <li>Tudo é salvo automaticamente no seu navegador (localStorage).</li>
          <li><b>Salvar/Exportar</b> baixa um arquivo <code>projeto-nocode.json</code> com <i>todo</i> o projeto (arquivos + fluxos).</li>
          <li><b>Importar</b> carrega um <code>.json</code> exportado anteriormente, substituindo o projeto atual.</li>
        </ul>

        <h2>8. Gravando no GitHub</h2>
        <p>Este editor roda dentro do Lovable, que oferece sincronização bidirecional com GitHub:</p>
        <ol>
          <li>Na barra do Lovable, abra o menu <kbd>+</kbd> → <b>GitHub</b> → <b>Connect project</b>.</li>
          <li>Autorize o GitHub App e escolha a conta/organização.</li>
          <li>Clique em <b>Create Repository</b> — o código do FluxoStudio é enviado ao seu GitHub.</li>
          <li>A partir daí, cada alteração feita aqui é enviada automaticamente para o repositório.</li>
        </ol>
        <p>Já os <i>projetos</i> criados dentro do editor (páginas, componentes, fluxos) são persistidos como JSON. Faça <i>Salvar/Exportar</i> e adicione o arquivo <code>projeto-nocode.json</code> ao repositório se quiser versioná-los junto.</p>

        <hr />
        <p className="text-sm text-muted-foreground">
          Dica: comece criando uma <i>Página</i>, adicione um <i>Botão</i>, crie um <i>Fluxo</i> com um nó <i>HTTP</i> apontando para uma API pública, vincule o <code>onClick</code> ao fluxo e clique em <b>Executar</b> no painel de fluxo — pronto, seu primeiro no-code está de pé.
        </p>
      </article>
    </div>
  );
}