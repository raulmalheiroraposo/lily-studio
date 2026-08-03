/**
 * Compiles user-authored JSX/TSX source into a live React component,
 * entirely in the browser (Babel standalone, lazily loaded).
 */
import * as React from "react";

type BabelModule = {
  transform: (
    code: string,
    opts: Record<string, unknown>
  ) => { code?: string | null };
};

let babelPromise: Promise<BabelModule> | null = null;
async function getBabel(): Promise<BabelModule> {
  babelPromise ??= import("@babel/standalone") as unknown as Promise<BabelModule>;
  return babelPromise;
}

export type CompiledComponent = React.ComponentType<Record<string, unknown>>;

const cache = new Map<string, CompiledComponent>();

function wrap(source: string) {
  const src = source.trim();
  const hasModuleShape =
    /(^|\n)\s*export\s+default/.test(src) ||
    /(^|\n)\s*export\s+(function|const|class)/.test(src);
  if (hasModuleShape) return src;
  // Bare body: treat as the render body of a component.
  return `function Componente(props) {\n${src}\n}\nexport default Componente;`;
}

export async function compileComponent(source: string): Promise<CompiledComponent> {
  const key = source;
  const cached = cache.get(key);
  if (cached) return cached;

  const Babel = await getBabel();
  // Imports cannot be resolved at runtime; React/hooks are injected in scope.
  const withoutImports = wrap(source).replace(/^\s*import\s[^\n]*\n?/gm, "");
  const out = Babel.transform(withoutImports, {
    filename: "component.tsx",
    presets: [["react", { runtime: "classic" }], "typescript"],
    plugins: ["transform-modules-commonjs"],
    sourceType: "module",
  });
  const compiled = out.code;
  if (!compiled) throw new Error("Falha ao compilar o código.");

  const exports: Record<string, unknown> = {};
  const require = (name: string) => {
    if (name === "react") return React;
    throw new Error(`Import não suportado no preview: "${name}"`);
  };
  const fn = new Function(
    "React",
    "exports",
    "module",
    "require",
    "useState",
    "useEffect",
    "useMemo",
    "useRef",
    "useCallback",
    compiled
  );
  const moduleObj = { exports };
  fn(
    React,
    exports,
    moduleObj,
    require,
    React.useState,
    React.useEffect,
    React.useMemo,
    React.useRef,
    React.useCallback
  );

  const resolved =
    (exports["default"] as CompiledComponent | undefined) ??
    (Object.values(exports).find((v) => typeof v === "function") as
      | CompiledComponent
      | undefined);
  if (!resolved) throw new Error("Nenhum componente exportado (use `export default`).");
  cache.set(key, resolved);
  return resolved;
}
