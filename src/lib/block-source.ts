/* Código fonte de uma página/componente inteiro ou apenas do elemento selecionado. */
import type { Block, ProjectFile } from "./types";
import { buildPageHtml } from "./site-builder";
import { parsePageHtml } from "./html-importer";
import { blocksToTsx } from "./tsx-generator";
import { parseComponentTsx } from "./tsx-importer";

function extract(lines: string[], marker: string, closeLine?: string) {
  const start = lines.findIndex((l) => l.includes(marker));
  if (start < 0) return "";
  if (!closeLine) return lines[start].trim();
  const end = lines.findIndex((l, i) => i > start && l === closeLine);
  return lines.slice(start, end < 0 ? start + 1 : end + 1).map((l) => l.replace(/^ {6}/, "")).join("\n");
}

export function fileSourceFor(
  file: ProjectFile,
  files: ProjectFile[],
  tags: Record<string, string>,
  selectedId?: string | null
): string {
  const block = selectedId ? file.blocks?.find((b) => b.id === selectedId) : undefined;
  if (file.type === "page") {
    const pages = files.filter((f) => f.type === "page");
    if (!block) return buildPageHtml(file, files, { pages, vendorLocal: false });
    const html = buildPageHtml({ ...file, blocks: [block] }, files, { pages, vendorLocal: false });
    return extract(html.split("\n"), `data-block-id="${block.id}"`);
  }
  if (!block) return file.code ?? "";
  const tsx = blocksToTsx(file.name, [block], "", tags);
  return extract(tsx.split("\n"), `data-block-id={${JSON.stringify(block.id)}}`, "      </div>");
}

/** Aplica o código editado; retorna os novos blocos do arquivo (ou null para código completo de componente). */
export function applySource(
  file: ProjectFile,
  source: string,
  tagIds: Record<string, string>,
  selectedId?: string | null
): Block[] {
  const all = file.blocks ?? [];
  const block = selectedId ? all.find((b) => b.id === selectedId) : undefined;
  if (!block) {
    return file.type === "page"
      ? parsePageHtml(source, all).blocks
      : parseComponentTsx(source, all, tagIds).blocks;
  }
  // O elemento editado continua sendo o selecionado, mesmo que o id tenha sido apagado ou alterado.
  if (/data-block-id=/.test(source)) {
    source = source.replace(/data-block-id=(\{?)"[^"]*"(\}?)/, `data-block-id=$1"${block.id}"$2`);
  } else {
    source = file.type === "page"
      ? `<div data-block-id="${block.id}" style="position:absolute;left:${block.x}px;top:${block.y}px;width:${block.w}px;height:${block.h}px;">${source}</div>`
      : `<div data-block-id={"${block.id}"} style={{position:"absolute",left:"${block.x}px",top:"${block.y}px",width:"${block.w}px",height:"${block.h}px"}}>${source}</div>`;
  }
  const parsed =
    file.type === "page"
      ? parsePageHtml(`<div class="page">${source}</div>`, [block]).blocks
      : parseComponentTsx(`export default function X() {\n  return (\n    <div>\n${source}\n    </div>\n  );\n}`, [block], tagIds).blocks;
  const i = all.findIndex((b) => b.id === block.id);
  return [...all.slice(0, i), ...parsed, ...all.slice(i + 1)];
}
