/* Abrir/salvar arquivos e pastas locais (File System Access API, com alternativas). */
import { useProject } from "./project-store";
import { buildPageHtml } from "./site-builder";
import { parsePageHtml } from "./html-importer";
import { folderOf, normalizeFolder, typeFromName } from "./folders";
import { downloadBlob } from "./export-zip";
import type { ProjectFile, ProjectState } from "./types";

type Entry = { path: string; text: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandle = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

let rootDir: AnyHandle | null = null;
const fileHandles = new Map<string, AnyHandle>();

export const hasFsApi = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

function pickWithInput(opts: { dir?: boolean; accept?: string }): Promise<Entry[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (opts.accept) input.accept = opts.accept;
    if (opts.dir) input.setAttribute("webkitdirectory", "");
    input.onchange = async () => {
      const list = Array.from(input.files ?? []);
      resolve(
        await Promise.all(
          list.map(async (f) => ({
            path: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
            text: await f.text(),
          }))
        )
      );
    };
    input.click();
  });
}

async function walk(dir: AnyHandle, prefix = ""): Promise<Entry[]> {
  const out: Entry[] = [];
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if (h.kind === "directory") out.push(...(await walk(h, path)));
    else if (typeFromName(name) || name.endsWith(".json")) {
      out.push({ path, text: await (await h.getFile()).text() });
    }
  }
  return out;
}

/** Carrega entradas no projeto. Retorna quantos arquivos foram abertos. */
function load(entries: Entry[], stripRoot: boolean): number {
  const st = useProject.getState();
  const proj = entries.find((e) => /(^|\/)(projeto-nocode|projeto-lily)\.json$/.test(e.path));
  if (proj) {
    st.importProject(JSON.parse(proj.text) as ProjectState);
    return useProject.getState().files.length;
  }
  let n = 0;
  for (const e of entries) {
    const parts = e.path.split("/");
    const name = parts.pop()!;
    if (stripRoot && parts.length) parts.shift();
    const type = typeFromName(name);
    if (!type) continue;
    const folder = normalizeFolder(parts.join("/"));
    const existing = useProject
      .getState()
      .files.find((f) => f.name === name && (!folder || folderOf(f) === folder));
    const id = existing?.id ?? st.createFile(type, name, folder || undefined);
    if (type === "page") {
      const file = useProject.getState().files.find((f) => f.id === id)!;
      st.setBlocks(id, parsePageHtml(e.text, file.blocks ?? []).blocks);
    } else st.updateFileCode(id, e.text);
    n++;
  }
  return n;
}

export async function openFiles(): Promise<number> {
  const accept = ".html,.htm,.tsx,.jsx,.js,.ts,.css,.json";
  if ("showOpenFilePicker" in window) {
    try {
      const hs: AnyHandle[] = await w().showOpenFilePicker({ multiple: true });
      const entries = await Promise.all(hs.map(async (h) => ({ path: h.name, text: await (await h.getFile()).text() })));
      const n = load(entries, false);
      for (const h of hs) {
        const f = useProject.getState().files.find((x) => x.name === h.name);
        if (f) fileHandles.set(f.id, h);
      }
      return n;
    } catch {
      return 0;
    }
  }
  return load(await pickWithInput({ accept }), false);
}

export async function openFolder(): Promise<number> {
  if (hasFsApi()) {
    try {
      rootDir = await w().showDirectoryPicker({ mode: "readwrite" });
      return load(await walk(rootDir), false);
    } catch {
      return 0;
    }
  }
  return load(await pickWithInput({ dir: true }), true);
}

function relativePath(fromFolder: string, toPath: string) {
  const from = normalizeFolder(fromFolder).split("/").filter(Boolean);
  const to = normalizeFolder(toPath).split("/").filter(Boolean);
  while (from.length && to.length && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return [...from.map(() => ".."), ...to].join("/") || ".";
}

export function fileSource(f: ProjectFile, files: ProjectFile[]) {
  if (f.type === "page") return buildPageHtml(f, files, {
    pages: files.filter((x) => x.type === "page"),
    vendorLocal: false,
    styleHref: (style) => relativePath(folderOf(f), `${folderOf(style)}/${style.name}`),
  });
  return f.code ?? "";
}

async function writeIn(dir: AnyHandle, path: string, text: string) {
  const parts = path.split("/");
  const name = parts.pop()!;
  let d = dir;
  for (const p of parts) d = await d.getDirectoryHandle(p, { create: true });
  const fh = await d.getFileHandle(name, { create: true });
  const wr = await fh.createWritable();
  await wr.write(text);
  await wr.close();
}

/** Salva todos os arquivos do projeto na pasta local (pede a pasta se ainda não houver). */
export async function saveAll(): Promise<string> {
  const { files, exportProject } = useProject.getState();
  if (!rootDir && hasFsApi()) {
    try {
      rootDir = await w().showDirectoryPicker({ mode: "readwrite" });
    } catch {
      return "Salvamento cancelado.";
    }
  }
  if (rootDir) {
    for (const f of files) {
      const folder = folderOf(f);
      await writeIn(rootDir, folder ? `${folder}/${f.name}` : f.name, fileSource(f, files));
    }
    await writeIn(rootDir, "projeto-lily.json", JSON.stringify(exportProject(), null, 2));
    return `Projeto salvo na pasta "${rootDir.name}".`;
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) zip.file(`${folderOf(f) ? folderOf(f) + "/" : ""}${f.name}`, fileSource(f, files));
  zip.file("projeto-lily.json", JSON.stringify(exportProject(), null, 2));
  downloadBlob(await zip.generateAsync({ type: "blob" }), "projeto-lily.zip");
  return "Seu navegador não permite gravar pastas; os arquivos foram baixados em um ZIP.";
}

/** Salva o arquivo ativo escolhendo um novo nome. */
export async function saveAs(): Promise<string> {
  const { files, activeFileId, renameFile } = useProject.getState();
  const f = files.find((x) => x.id === activeFileId);
  if (!f) return "Abra um arquivo antes de usar Salvar Como.";
  const text = fileSource(f, files);
  if ("showSaveFilePicker" in window) {
    try {
      const h = await w().showSaveFilePicker({ suggestedName: f.name });
      const wr = await h.createWritable();
      await wr.write(text);
      await wr.close();
      fileHandles.set(f.id, h);
      if (h.name !== f.name) renameFile(f.id, h.name);
      return `Salvo como ${h.name}.`;
    } catch {
      return "Salvamento cancelado.";
    }
  }
  const name = prompt("Salvar como:", f.name);
  if (!name) return "Salvamento cancelado.";
  if (name !== f.name) renameFile(f.id, name);
  downloadBlob(new Blob([text], { type: "text/plain" }), name);
  return `Salvo como ${name}.`;
}
