import JSZip from "jszip";
import type { ProjectFile, ProjectState } from "./types";
import { SITE_RUNTIME_JS, buildPageHtml, pageFileName, scriptFileName } from "./site-builder";

const VENDORS: { file: string; url: string }[] = [
  { file: "react.js", url: "https://unpkg.com/react@18/umd/react.production.min.js" },
  { file: "react-dom.js", url: "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" },
  { file: "babel.js", url: "https://unpkg.com/@babel/standalone@7.28.4/babel.min.js" },
];

export async function fetchVendors() {
  try {
    const files = await Promise.all(
      VENDORS.map(async (v) => {
        const res = await fetch(v.url);
        if (!res.ok) throw new Error(`${v.url} → ${res.status}`);
        return { file: v.file, code: await res.text() };
      })
    );
    return files;
  } catch (err) {
    console.warn("[export-zip] não foi possível embutir as bibliotecas offline:", err);
    return null;
  }
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

/** Escreve o site completo (offline) dentro de uma pasta do ZIP. */
export function writeSite(site: JSZip, project: ProjectState, vendors: { file: string; code: string }[] | null) {
  const scripts = project.files.filter((f) => f.type === "script");
  const pages = project.files.filter((f) => f.type === "page");

  // --- Site completo, funcional offline ---
  for (const page of pages) {
    site.file(pageFileName(page), buildPageHtml(page, project.files, { pages, vendorLocal: !!vendors }));
  }
  const firstPage = pages[0];
  if (firstPage && pageFileName(firstPage) !== "index.html") {
    site.file(
      "index.html",
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" /><meta http-equiv="refresh" content="0; url=${pageFileName(
        firstPage
      )}" /><title>Site Lily Studio</title></head><body><a href="${pageFileName(firstPage)}">Abrir site</a></body></html>`
    );
  }
  site.file("runtime.js", SITE_RUNTIME_JS);
  for (const s of scripts) site.file(`scripts/${scriptFileName(s)}`, s.code ?? "");
  if (vendors) for (const v of vendors) site.file(`vendor/${v.file}`, v.code);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportProjectZip(project: ProjectState) {
  const zip = new JSZip();
  const vendors = await fetchVendors();
  writeSite(zip.folder("site")!, project, vendors);

  // --- Fontes do projeto ---
  for (const file of project.files) {
    if (file.type === "script") {
      zip.file(`scripts/${scriptFileName(file)}`, file.code ?? "");
    } else if (file.type === "component") {
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
    `# Projeto exportado do Lily Studio

- \`site/\` — **site completo e funcional offline**. Abra \`site/index.html\` (ou a página desejada) direto no navegador: blocos, gráficos, componentes React, scripts, eventos e painel de logs funcionam como no Preview.
- \`site/vendor/\` — React, ReactDOM e o compilador Babel ${
      vendors ? "embutidos, portanto nada é baixado da internet" : "**não** foram embutidos (falha ao baixar); o site usará CDN e precisa de internet"
    }.
- \`site/scripts/\` — scripts do projeto usados pelos eventos
- \`components/\` — componentes React (.tsx)
- \`scripts/\` — código-fonte dos scripts
- \`projeto-nocode.json\` — projeto completo (reimporte no Lily Studio)

Gerado em ${new Date().toLocaleString("pt-BR")}.
`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "projeto-lily-studio.zip");
}
