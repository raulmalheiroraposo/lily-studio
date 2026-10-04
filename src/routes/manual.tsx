import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual — Lily Studio" },
      { name: "description", content: "Guia completo de uso da plataforma no-code Lily Studio: canvas, componentes, scripts, propriedades, atributos, eventos e editor de código." },
      { property: "og:title", content: "Manual — Lily Studio" },
      { property: "og:description", content: "Como usar o editor visual, criar scripts e editar código." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
          <h1 className="text-lg font-bold">Manual do Lily Studio</h1>
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
          O <b className="text-foreground">Lily Studio</b> é uma plataforma no-code para construir páginas HTML, componentes React e scripts — arraste, edite, vincule eventos e execute.
        </p>

        <h2>1. Interface</h2>
        <ul>
          <li><b>Barra superior:</b> nome do projeto, arquivo aberto, alternador <i>Preview / Editar</i>, botões <i>Importar</i>, <i>Salvar/Exportar</i> e <i>Manual</i>.</li>
          <li><b>Painel esquerdo:</b> alterna entre <i>Arquivos</i> (páginas HTML, componentes React, scripts e estilos CSS) e <i>Componentes</i> (paleta HTML/CSS/Gráficos/React).</li>
          <li><b>Canvas central:</b> área de edição visual do arquivo aberto (drag &amp; resize).</li>
          <li><b>Painel direito:</b> propriedades, atributos, estilo e eventos do componente selecionado.</li>
        </ul>

        <h2>2. Criando um arquivo</h2>
        <ol>
          <li>Em <i>Arquivos</i>, clique no <kbd>+</kbd> ao lado do grupo desejado:
            <ul>
              <li><b>Páginas HTML</b> — página do site montada com blocos HTML.</li>
              <li><b>Componentes React</b> — bloco reutilizável com código React.</li>
              <li><b>Scripts</b> — arquivo JavaScript com funções que podem ser chamadas por eventos.</li>
              <li><b>Estilos CSS</b> — folha de estilos reutilizável, vinculada a uma ou mais páginas.</li>
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

        <h2>4. Editando propriedades, atributos, estilo e eventos</h2>
        <p>Com um componente selecionado, o painel direito mostra quatro abas:</p>
        <ul>
          <li><b>Props:</b> texto, atributos (src, href, placeholder), largura/altura.</li>
          <li><b>Attrs:</b> atributos HTML dinâmicos aplicados diretamente à tag (ex.: <code>id</code>, <code>title</code>, <code>data-*</code>, <code>aria-*</code>). Adicione qualquer par nome/valor.</li>
          <li><b>Estilo:</b> vincule arquivos CSS à página e edite background, color, border, borderRadius, padding, fontSize, fontWeight e textAlign do bloco selecionado.</li>
          <li><b>Eventos:</b> escolha um evento (<code>onClick</code>, <code>onChange</code> etc.) e vincule a uma <b>função de script</b> ou a uma <b>URL</b> (site/API) com o método HTTP desejado.</li>
        </ul>

        <h2>5. Scripts</h2>
        <p>Scripts são arquivos JavaScript. Toda função declarada no topo (via <code>function</code>, <code>const</code>, <code>let</code> ou <code>var</code>) fica automaticamente disponível na aba <i>Eventos</i> de qualquer componente.</p>
        <ol>
          <li>Crie um script em <i>Arquivos → Scripts → +</i>.</li>
          <li>Escreva funções, ex.: <code>function saudacao() {"{"} alert('Oi!'); {"}"}</code>.</li>
          <li>Selecione um componente, vá em <i>Eventos</i>, escolha <i>Função de script</i>, o script e a função. Clique <b>Vincular função</b>.</li>
          <li>Para chamar uma URL, escolha <i>URL</i>, informe método e endereço e clique <b>Vincular URL</b>.</li>
          <li>Ative <b>Preview</b> na barra superior para disparar os eventos de verdade.</li>
        </ol>

        <h2>6. Editor de código-fonte (Monaco)</h2>
        <p>Para componentes <b>React</b> há um botão <i>Editar código-fonte</i>. Arquivos de <b>Script</b> abrem o editor diretamente no canvas. Ambos oferecem:</p>
        <ul>
          <li>Realce de sintaxe para JavaScript, TypeScript, HTML, CSS e JSON, com linguagem selecionável.</li>
          <li>Temas claro, escuro e alto contraste, numeração de linhas, minimapa e dobra de código.</li>
          <li>Alterações salvas automaticamente no projeto.</li>
        </ul>

        <h2>6.4 Estilos CSS da página</h2>
        <ol>
          <li>Crie um arquivo de <b>Estilo CSS</b> pelo botão de novo arquivo na árvore.</li>
          <li>Abra uma página, deixe o canvas sem bloco selecionado e use o painel direito para vincular os arquivos CSS desejados.</li>
          <li>Também é possível usar <b>Criar e vincular CSS</b> na aba <i>Estilo</i> de qualquer bloco selecionado.</li>
          <li>Clique no ícone de código ao lado do CSS vinculado para editá-lo no Monaco. As mudanças aparecem no canvas e no Preview.</li>
          <li>Os arquivos vinculados são incluídos automaticamente no site, no ZIP e nas gravações locais.</li>
        </ol>

        <h2>6.1 Componentes React funcionais</h2>
        <p>O código dos blocos React é compilado no navegador (JSX/TSX) e <b>executa de verdade</b> no canvas, no Preview e no site publicado — inclusive com hooks (<code>useState</code>, <code>useEffect</code>, <code>useMemo</code>, <code>useRef</code>, <code>useCallback</code>) já disponíveis no escopo. Use <code>export default function ...</code> (ou apenas o corpo com <code>return (...)</code>).</p>
        <ul>
          <li><b>Arquivo de componente</b>: em <i>Arquivos → Componentes React → +</i> um arquivo <code>.tsx</code> é criado e abre com editor + preview ao vivo lado a lado.</li>
          <li><b>Vincular</b>: selecione um bloco React no canvas e escolha o arquivo em <i>Props → Arquivo de componente React</i>. O bloco passa a renderizar o código daquele arquivo.</li>
          <li><b>Abrir</b>: <i>Abrir arquivo .tsx</i> importa um arquivo do seu computador como novo componente do projeto.</li>
          <li><b>Salvar</b>: <i>Baixar como .tsx</i> exporta o código; <i>Salvar como arquivo do projeto</i> converte o código embutido do bloco em arquivo reutilizável.</li>
          <li>Erros de compilação/execução aparecem dentro do próprio bloco, sem quebrar o editor.</li>
        </ul>

        <h2>6.2 Código-fonte ↔ canvas (mão dupla)</h2>
        <p>Os botões <b>Código HTML</b> (páginas) e <b>Código TSX</b> (componentes) abrem o código real do arquivo. Ao salvar, o canvas é atualizado:</p>
        <ul>
          <li><b>Tags novas</b> escritas à mão viram novos blocos (posição/tamanho vindos do <code>style</code>; sem posição, são empilhados automaticamente).</li>
          <li><b>Alterações</b> em texto, estilos inline e atributos dos blocos existentes são aplicadas.</li>
          <li><b>Tags removidas</b> do código excluem os blocos correspondentes.</li>
          <li>Não remova o atributo <code>data-block-id</code> dos wrappers: ele é o que liga cada bloco ao seu código.</li>
          <li>Ao abrir um arquivo <code>.tsx</code> com código e canvas vazio, os blocos são recriados a partir do código automaticamente.</li>
        </ul>

        <h2>6.3 Gráficos com dados reais</h2>
        <p>Selecione um gráfico e preencha, na aba <b>Props</b>, o campo <b>Fonte de dados</b> (ou o atributo <code>data-source</code>):</p>
        <ul>
          <li><b>JSON inline:</b> <code>[{"{"}"name":"Jan","value":40{"}"}]</code> ou <code>{"{"}"Jan":40,"Fev":30{"}"}</code>.</li>
          <li><b>URL de site/API:</b> <code>/api/vendas</code> ou <code>https://exemplo.com/dados.json</code> (o JSON pode ser um array ou um objeto com o array dentro).</li>
          <li><b>Função de script:</b> o nome de uma função declarada em um arquivo de script (pode ser <code>async</code> e retornar o array).</li>
          <li>Use <b>campo do rótulo</b> e <b>campo do valor</b> (<code>nameKey</code>/<code>valueKey</code>) quando as chaves do seu JSON tiverem outros nomes.</li>
          <li>Funciona no canvas, no Preview e no site exportado em ZIP (offline, para JSON inline e funções de script).</li>
        </ul>


        <h2>7. Salvar, abrir e exportar</h2>
        <ul>
          <li><b>Autosave:</b> toda alteração no canvas, nos scripts e nos arquivos é salva na hora no navegador — a barra superior mostra o horário do último salvamento.</li>
          <li><b>Histórico:</b> aba <i>Histórico</i> no painel esquerdo lista os últimos 50 pontos de alteração; clique em um deles para restaurar. Também há <i>Desfazer</i>/<i>Refazer</i> na barra superior.</li>
          <li><b>Exportar Projeto</b> baixa um arquivo <code>projeto-nocode.json</code> com <i>todo</i> o projeto (páginas, componentes, scripts e estilos).</li>
          <li><b>Baixar ZIP</b> gera um pacote com <code>pages/*.html</code>, <code>components/*.tsx</code>, <code>scripts/*.js</code>, o JSON do projeto e um LEIA-ME — ideal para compartilhar.</li>
          <li><b>Importar Projeto</b> carrega um <code>.json</code> exportado anteriormente, substituindo o projeto atual.</li>
        </ul>

        <h2>8. Painel de logs no Preview</h2>
        <ul>
          <li>Ao ativar o <b>Preview</b>, um painel de logs aparece abaixo do canvas.</li>
          <li>Cada evento registra: método/URL e status HTTP das requisições, nome da função executada, tempo de execução e mensagens de erro.</li>
          <li>Use <i>Limpar</i> para zerar a lista.</li>
        </ul>

        <h2>9. Organizando scripts</h2>
        <ul>
          <li>Na aba <i>Arquivos</i>, use <kbd>+</kbd> em <b>Scripts</b> para criar quantos arquivos quiser.</li>
          <li>O ícone de lápis renomeia o arquivo (Enter confirma, Esc cancela) e o campo de filtro localiza arquivos por nome.</li>
          <li>No painel <i>Eventos</i>, escolha o script e depois a função exata que o evento deve chamar.</li>
        </ul>

        <h2>10. Gravando no GitHub</h2>
        <p>Este editor roda dentro do Lovable, que oferece sincronização bidirecional com GitHub:</p>
        <ol>
          <li>Na barra do Lovable, abra o menu <kbd>+</kbd> → <b>GitHub</b> → <b>Connect project</b>.</li>
          <li>Autorize o GitHub App e escolha a conta/organização.</li>
          <li>Clique em <b>Create Repository</b> — o código do Lily Studio é enviado ao seu GitHub.</li>
          <li>A partir daí, cada alteração feita aqui é enviada automaticamente para o repositório.</li>
        </ol>
        <p>Já os <i>projetos</i> criados dentro do editor (páginas, componentes, scripts) são persistidos como JSON. Faça <i>Salvar/Exportar</i> e adicione o arquivo <code>projeto-nocode.json</code> ao repositório se quiser versioná-los junto.</p>

        <hr />
        <p className="text-sm text-muted-foreground">
          Dica: crie uma <i>Página</i>, adicione um <i>Botão</i>, crie um <i>Script</i> com <code>function alo() {"{"} alert('Olá!') {"}"}</code>, vincule o <code>onClick</code> do botão à função <code>alo</code> e clique em <b>Preview</b> — pronto, seu primeiro no-code está de pé.
        </p>
      </article>
    </div>
  );
}