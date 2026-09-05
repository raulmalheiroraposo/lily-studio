/**
 * Helpers to reference component files as JSX tags, so a React component
 * nested inside another lives in its own `.tsx` file and is reused by tag.
 */
import type { ProjectFile } from "./types";

/** `Contador.tsx` -> `Contador` (a valid, capitalized JSX tag). */
export function componentTag(fileName: string): string {
  const base = fileName.replace(/\.[jt]sx?$/i, "").replace(/[^A-Za-z0-9_]/g, "");
  const safe = base || "Componente";
  return safe.charAt(0).toUpperCase() + safe.slice(1);
}

/** Map of component fileId -> JSX tag. */
export function componentTagMap(files: ProjectFile[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of files) if (f.type === "component") out[f.id] = componentTag(f.name);
  return out;
}

/** Map of JSX tag -> component fileId (reverse of `componentTagMap`). */
export function tagToFileId(files: ProjectFile[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of files) if (f.type === "component") out[componentTag(f.name)] = f.id;
  return out;
}

/** Map of JSX tag -> source code, used to compile nested components. */
export function componentSources(files: ProjectFile[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of files) if (f.type === "component") out[componentTag(f.name)] = f.code ?? "";
  return out;
}
