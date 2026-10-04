import type { ProjectFile } from "./types";

export const DEFAULT_FOLDER: Record<ProjectFile["type"], string> = {
  page: "paginas",
  component: "componentes",
  script: "scripts",
  style: "estilos",
};

/** Pasta onde o arquivo aparece na árvore (padrão pelo tipo quando não definida). */
export function folderOf(f: ProjectFile): string {
  return (f.folder ?? DEFAULT_FOLDER[f.type]).replace(/^\/+|\/+$/g, "");
}

export function normalizeFolder(p: string) {
  return p.replace(/\\/g, "/").split("/").map((x) => x.trim()).filter(Boolean).join("/");
}

export function typeFromName(name: string): ProjectFile["type"] | null {
  const n = name.toLowerCase();
  if (/\.html?$/.test(n)) return "page";
  if (/\.(tsx|jsx)$/.test(n)) return "component";
  if (/\.(js|ts|mjs)$/.test(n)) return "script";
  if (/\.css$/.test(n)) return "style";
  return null;
}
