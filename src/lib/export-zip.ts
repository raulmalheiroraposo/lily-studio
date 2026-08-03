import JSZip from "jszip";
import type { Block, ProjectFile, ProjectState } from "./types";

function styleToCss(style: Record<string, string>) {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${v};`)
    .join(" ");
}

function attrsToHtml(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, "&quot;")}"`)
    .join("");
}

function blockToHtml(block: Block) {
  const pos = `position:absolute; left:${block.x}px; top:${block.y}px; width:${block.w}px; height:${block.h}px; ${styleToCss(
    block.style ?? {}
  )}`;
  const a = attrsToHtml(block.attrs ?? {});
  const text = block.text ?? "";
  switch (block.kind) {
    case "heading":
      return `  <h2 style="${pos}"${a}>${text}</h2>`;
    case "paragraph":
      return `  <p style="${pos}"${a}>${text}</p>`;
    case "button":
      return `  <button type="button" style="${pos}"${a}>${text}</button>`;
    case "input":
      return `  <input placeholder="${block.props.placeholder ?? ""}" style="${pos}"${a} />`;
    case "image":
      return `  <img src="${block.props.src ?? ""}" alt="${block.props.alt ?? ""}" style="${pos}"${a} />`;
    case "link":
      return `  <a href="${block.props.href ?? "#"}" style="${pos}"${a}>${text}</a>`;
    case "chart-bar":
    case "chart-line":
    case "chart-pie":
      return `  <div data-chart="${block.kind}" style="${pos}"${a}>[gráfico ${block.kind}]</div>`;
    case "react":
      return `  <div data-react-block="${block.id}" style="${pos}"${a}></div>`;
    default:
      return `  <div style="${pos}"${a}>${text}</div>`;
  }
}

function pageToHtml(file: ProjectFile, scripts: ProjectFile[]) {
  const blocks = (file.blocks ?? []).map(blockToHtml).join("\n");
  const scriptTags = scripts.map((s) => `  <script src="scripts/${s.name}"></script>`).join("\n");
  const bindings = (file.blocks ?? [])
    .flatMap((b) =>
      (b.events ?? []).map((ev) => {
        const sel = `[data-block-id="${b.id}"]`;
        const type = ev.event.replace(/^on/, "").toLowerCase();
        const body =
          ev.kind === "function"
            ? `typeof ${ev.functionName} === 'function' && ${ev.functionName}(e)`
            : `fetch(${JSON.stringify(ev.url)}, { method: ${JSON.stringify(ev.method)} })`;
        return `    document.querySelector('${sel}')?.addEventListener('${type}', function (e) { ${body}; });`;
      })
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${file.name.replace(/\.html$/, "")}</title>
  <style>body { margin: 0; font-family: system-ui, sans-serif; } .page { position: relative; min-height: 100vh; }</style>
</head>
<body>
<div class="page">
${blocks}
</div>
${scriptTags}
  <script>
${bindings}
  </script>
</body>
</html>
`;
}

function componentToTsx(file: ProjectFile) {
  if (typeof file.code === "string" && file.code.trim()) return file.code;
  const name = file.name.replace(/\.[jt]sx?$/, "").replace(/[^A-Za-z0-9_]/g, "") || "Componente";
  const blocks = (file.blocks ?? [])
    .map(
      (b) =>
        `      <div style={{ position: "absolute", left: ${b.x}, top: ${b.y}, width: ${b.w}, height: ${b.h} }}>\n        ${
          b.kind === "react" ? "{/* bloco React */}" : `{${JSON.stringify(b.text ?? b.kind)}}`
        }\n      </div>`
    )
    .join("\n");
  return `export default function ${name}() {
  return (
    <div style={{ position: "relative" }}>
${blocks}
    </div>
  );
}
`;
}

export async function exportProjectZip(project: ProjectState) {
  const zip = new JSZip();
  const scripts = project.files.filter((f) => f.type === "script");

  for (const file of project.files) {
    if (file.type === "script") {
      zip.file(`scripts/${file.name}`, file.code ?? "");
    } else if (file.type === "page") {
      zip.file(`pages/${file.name.endsWith(".html") ? file.name : `${file.name}.html`}`, pageToHtml(file, scripts));
    } else {
      zip.file(
        `components/${file.name.endsWith(".tsx") ? file.name : `${file.name}.tsx`}`,
        componentToTsx(file)
      );
      for (const b of file.blocks ?? []) {
        if (b.kind === "react" && b.code) zip.file(`components/blocks/${b.id}.jsx`, b.code);
      }
    }
  }

  zip.file("projeto-nocode.json", JSON.stringify(project, null, 2));
  zip.file(
    "LEIA-ME.md",
    `# Projeto exportado do FluxoStudio\n\n- \`pages/\` — páginas HTML geradas\n- \`components/\` — componentes React\n- \`scripts/\` — scripts JavaScript usados pelos eventos\n- \`projeto-nocode.json\` — projeto completo (reimporte no FluxoStudio)\n\nGerado em ${new Date().toLocaleString("pt-BR")}.\n`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "projeto-fluxostudio.zip";
  a.click();
  URL.revokeObjectURL(url);
}