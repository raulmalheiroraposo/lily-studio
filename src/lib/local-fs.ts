/* Abrir/salvar arquivos e pastas locais.
 * - App desktop (Electron): lê e grava direto no disco, na pasta original (salvamento automático).
 * - Navegador: File System Access API, com alternativas de download/input. */
import { useProject } from "./project-store";
import { buildPageHtml } from "./site-builder";
import { parsePageHtml } from "./html-importer";
import { folderOf, normalizeFolder, typeFromName } from "./folders";
import { downloadBlob } from "./export-zip";
import type { ProjectFile, ProjectState } from "./types";

type Entry = { path: string; text: string };
type DesktopFolder = { root: string; name: string; entries: Entry[]; dirs: string[] };
type DesktopFile = { path: string; name: string; text: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandle = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

export type LilyDesktopApi = {
  startServer: (files: Record<string, string>) => Promise<string>;
  openFolder?: () => Promise<DesktopFolder | null>;
  openFiles?: () => Promise<DesktopFile[]>;
  pickFolder?: () => Promise<string | null>;
  writeFile?: (absPath: string, text: string) => Promise<void>;
  renameFile?: (from: string, to: string) => Promise<void>;
};
const desktop = (): LilyDesktopApi | undefined =>
  typeof window === "undefined" ? undefined : (w().lilyDesktop as LilyDesktopApi | undefined);
export const isDesktop = () => !!desktop()?.writeFile;

let rootDir: AnyHandle | null = null;
const fileHandles = new Map<string, AnyHandle>();
/** Desktop: pasta raiz aberta e caminho absoluto de cada arquivo no disco. */
let desktopRoot: string | null = null;
const desktopPaths = new Map<string, string>();
const written = new Map<string, string>();

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

async function walk(dir: AnyHandle, prefix = "", dirs: string[] = []): Promise<Entry[]> {
  const out: Entry[] = [];
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if (h.kind === "directory") {
      dirs.push(path);
      out.push(...(await walk(h, path, dirs)));
    } else if (typeFromName(name) || name.endsWith(".json")) {
      out.push({ path, text: await (await h.getFile()).text() });
    }
  }
  return out;
}

const parentDirs = (paths: string[]) => {
  const set = new Set<string>();
  for (const p of paths) {
    const parts = p.split("/").slice(0, -1);
    for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join("/"));
  }
  return [...set];
};

/** Carrega entradas no projeto preservando a estrutura de pastas. Retorna ids por caminho. */
function load(entries: Entry[], opts: { stripRoot: boolean; fresh: boolean; dirs?: string[] }) {
  const st = useProject.getState();
  const ids = new Map<string, string>();
  const proj = entries.find((e) => /(^|\/)(projeto-nocode|projeto-lily)\.json$/.test(e.path));
  if (proj) {
    st.importProject(JSON.parse(proj.text) as ProjectState);
    return { count: useProject.getState().files.length, ids };
  }
  const strip = (p: string) => (opts.stripRoot ? p.split("/").slice(1).join("/") : p);
  if (opts.fresh) {
    const dirs = [...(opts.dirs ?? []), ...parentDirs(entries.map((e) => e.path))].map(strip).map(normalizeFolder).filter(Boolean);
    st.importProject({ files: [], activeFileId: null, selectedBlockId: null, folders: Array.from(new Set(dirs)) });
  }
  let count = 0;
  for (const e of entries) {
    const rel = strip(e.path);
    const parts = rel.split("/");
    const name = parts.pop()!;
    const type = typeFromName(name);
    if (!type) continue;
    const folder = normalizeFolder(parts.join("/"));
    const existing = useProject.getState().files.find((f) => f.name === name && folderOf(f) === folder);
    const id = existing?.id ?? useProject.getState().createFile(type, name, folder);
    if (type === "page") {
      const file = useProject.getState().files.find((f) => f.id === id)!;
      useProject.getState().setBlocks(id, parsePageHtml(e.text, file.blocks ?? []).blocks);
    } else useProject.getState().updateFileCode(id, e.text);
    ids.set(e.path, id);
    count++;
  }
  return { count, ids };
}

const joinPath = (root: string, rel: string) => `${root.replace(/[\\/]+$/, "")}/${rel}`;

export async function openFiles(): Promise<number> {
  const d = desktop();
  if (d?.openFiles) {
    const list = await d.openFiles();
    const { count, ids } = load(list.map((f) => ({ path: f.name, text: f.text })), { stripRoot: false, fresh: false });
    for (const f of list) {
      const id = ids.get(f.name);
      if (id) desktopPaths.set(id, f.path);
    }
    snapshotWritten();
    return count;
  }
  const accept = ".html,.htm,.tsx,.jsx,.js,.ts,.css,.json";
  if ("showOpenFilePicker" in window) {
    try {
      const hs: AnyHandle[] = await w().showOpenFilePicker({ multiple: true });
      const entries = await Promise.all(hs.map(async (h) => ({ path: h.name, text: await (await h.getFile()).text() })));
      const { count, ids } = load(entries, { stripRoot: false, fresh: false });
      for (const h of hs) {
        const id = ids.get(h.name);
        if (id) fileHandles.set(id, h);
      }
      return count;
    } catch {
      return 0;
    }
  }
  return load(await pickWithInput({ accept }), { stripRoot: false, fresh: false }).count;
}

export async function openFolder(): Promise<number> {
  const d = desktop();
  if (d?.openFolder) {
    const res = await d.openFolder();
    if (!res) return 0;
    desktopRoot = res.root;
    desktopPaths.clear();
    const { count } = load(res.entries, { stripRoot: false, fresh: true, dirs: res.dirs });
    for (const f of useProject.getState().files) {
      const folder = folderOf(f);
      desktopPaths.set(f.id, joinPath(res.root, folder ? `${folder}/${f.name}` : f.name));
    }
    snapshotWritten();
    return count;
  }
  if (hasFsApi()) {
    try {
      rootDir = await w().showDirectoryPicker({ mode: "readwrite" });
      const dirs: string[] = [];
      const entries = await walk(rootDir, "", dirs);
      return load(entries, { stripRoot: false, fresh: true, dirs }).count;
    } catch {
      return 0;
    }
  }
  return load(await pickWithInput({ dir: true }), { stripRoot: true, fresh: true }).count;
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

const relOf = (f: ProjectFile) => (folderOf(f) ? `${folderOf(f)}/${f.name}` : f.name);

function snapshotWritten() {
  const { files } = useProject.getState();
  written.clear();
  for (const f of files) if (desktopPaths.has(f.id)) written.set(f.id, `${desktopPaths.get(f.id)}\n${fileSource(f, files)}`);
}

/** Desktop: grava no disco apenas os arquivos alterados (e move/renomeia quando o caminho muda). */
async function flushDesktop(): Promise<number> {
  const d = desktop();
  if (!d?.writeFile) return 0;
  const { files } = useProject.getState();
  let n = 0;
  for (const f of files) {
    let target = desktopPaths.get(f.id);
    if (desktopRoot) {
      const expected = joinPath(desktopRoot, relOf(f));
      if (target && target !== expected && d.renameFile) await d.renameFile(target, expected);
      target = expected;
      desktopPaths.set(f.id, target);
    }
    if (!target) continue;
    const text = fileSource(f, files);
    const key = `${target}\n${text}`;
    if (written.get(f.id) === key) continue;
    await d.writeFile(target, text);
    written.set(f.id, key);
    n++;
  }
  return n;
}

let liveStarted = false;
/** No app desktop, salva automaticamente as edições nos arquivos originais. */
export function startDesktopLiveSave() {
  if (liveStarted || !isDesktop()) return;
  liveStarted = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  useProject.subscribe((s, prev) => {
    if (s.files === prev.files) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void flushDesktop().catch((e) => console.error("Falha ao salvar", e)), 700);
  });
}

/** Salva todos os arquivos do projeto na pasta local (pede a pasta se ainda não houver). */
export async function saveAll(): Promise<string> {
  const { files, exportProject } = useProject.getState();
  const d = desktop();
  if (d?.writeFile) {
    if (!desktopRoot && files.some((f) => !desktopPaths.has(f.id))) {
      const picked = await d.pickFolder?.();
      if (!picked) return "Salvamento cancelado.";
      desktopRoot = picked;
    }
    const n = await flushDesktop();
    return `${n} arquivo(s) gravado(s) no disco${desktopRoot ? ` em ${desktopRoot}` : ""}.`;
  }
  if (!rootDir && hasFsApi()) {
    try {
      rootDir = await w().showDirectoryPicker({ mode: "readwrite" });
    } catch {
      return "Salvamento cancelado.";
    }
  }
  if (rootDir) {
    for (const f of files) await writeIn(rootDir, relOf(f), fileSource(f, files));
    await writeIn(rootDir, "projeto-lily.json", JSON.stringify(exportProject(), null, 2));
    return `Projeto salvo na pasta "${rootDir.name}".`;
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) zip.file(relOf(f), fileSource(f, files));
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
