/**
 * Catalogue of the HTML attributes accepted by each block kind, used by the
 * properties panel. Attributes with a fixed set of accepted values are shown as
 * a combobox (select); a blank selection means "do not emit this attribute".
 */
import type { BlockKind } from "./types";

export type AttrSpec = {
  name: string;
  /** Fixed set of accepted values — rendered as a select. */
  options?: string[];
  /** Pre-selected/suggested value. */
  default?: string;
  /** Boolean attributes are rendered as a yes/no select. */
  kind?: "text" | "number" | "url" | "boolean";
  required?: boolean;
  hint?: string;
};

const bool = (name: string): AttrSpec => ({ name, kind: "boolean", options: ["", "true", "false"] });

export const GLOBAL_ATTRS: AttrSpec[] = [
  { name: "id" },
  { name: "className" },
  { name: "title" },
  { name: "lang" },
  { name: "dir", options: ["", "ltr", "rtl", "auto"] },
  { name: "role" },
  { name: "tabIndex", kind: "number" },
  { name: "draggable", options: ["", "true", "false"] },
  { name: "contentEditable", options: ["", "true", "false", "plaintext-only"] },
  { name: "spellCheck", options: ["", "true", "false"] },
  { name: "translate", options: ["", "yes", "no"] },
  bool("hidden"),
];

const INPUT_TYPES = [
  "",
  "text",
  "password",
  "email",
  "number",
  "tel",
  "url",
  "search",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
  "color",
  "range",
  "checkbox",
  "radio",
  "file",
  "hidden",
  "submit",
  "reset",
  "button",
];

const SPECIFIC: Partial<Record<BlockKind, AttrSpec[]>> = {
  button: [
    { name: "type", options: ["", "button", "submit", "reset"], default: "button" },
    { name: "name" },
    { name: "value" },
    { name: "form" },
    { name: "formAction", kind: "url" },
    { name: "formMethod", options: ["", "get", "post"] },
    bool("disabled"),
    bool("autoFocus"),
  ],
  input: [
    { name: "type", options: INPUT_TYPES, default: "text" },
    { name: "name" },
    { name: "value" },
    { name: "placeholder" },
    { name: "autoComplete", options: ["", "on", "off"] },
    {
      name: "inputMode",
      options: ["", "none", "text", "decimal", "numeric", "tel", "search", "email", "url"],
    },
    { name: "pattern" },
    { name: "min" },
    { name: "max" },
    { name: "step" },
    { name: "minLength", kind: "number" },
    { name: "maxLength", kind: "number" },
    { name: "accept" },
    bool("required"),
    bool("disabled"),
    bool("readOnly"),
    bool("checked"),
    bool("multiple"),
    bool("autoFocus"),
  ],
  image: [
    { name: "src", kind: "url", required: true },
    { name: "alt", required: true },
    { name: "width", kind: "number" },
    { name: "height", kind: "number" },
    { name: "loading", options: ["", "lazy", "eager"], default: "lazy" },
    { name: "decoding", options: ["", "sync", "async", "auto"] },
    { name: "crossOrigin", options: ["", "anonymous", "use-credentials"] },
    {
      name: "referrerPolicy",
      options: ["", "no-referrer", "no-referrer-when-downgrade", "origin", "origin-when-cross-origin", "same-origin", "strict-origin", "unsafe-url"],
    },
    { name: "srcSet" },
    { name: "sizes" },
  ],
  link: [
    { name: "href", kind: "url", required: true },
    { name: "target", options: ["", "_blank", "_self", "_parent", "_top"] },
    { name: "rel", options: ["", "noopener", "noreferrer", "noopener noreferrer", "nofollow", "external"] },
    { name: "download" },
    { name: "hrefLang" },
    { name: "type" },
    {
      name: "referrerPolicy",
      options: ["", "no-referrer", "origin", "same-origin", "strict-origin", "unsafe-url"],
    },
  ],
  heading: [{ name: "ariaLevel", kind: "number" }],
  video: [
    { name: "src", kind: "url", required: true },
    { name: "poster", kind: "url" },
    { name: "preload", options: ["", "none", "metadata", "auto"] },
    { name: "width", kind: "number" },
    { name: "height", kind: "number" },
    { name: "crossOrigin", options: ["", "anonymous", "use-credentials"] },
    bool("controls"),
    bool("autoPlay"),
    bool("loop"),
    bool("muted"),
    bool("playsInline"),
  ],
  audio: [
    { name: "src", kind: "url", required: true },
    { name: "preload", options: ["", "none", "metadata", "auto"] },
    { name: "crossOrigin", options: ["", "anonymous", "use-credentials"] },
    bool("controls"),
    bool("autoPlay"),
    bool("loop"),
    bool("muted"),
  ],
  canvas: [
    { name: "width", kind: "number" },
    { name: "height", kind: "number" },
  ],
  table: [
    { name: "summary" },
    { name: "cellPadding", kind: "number" },
    { name: "cellSpacing", kind: "number" },
  ],
  progress: [
    { name: "value", kind: "number" },
    { name: "max", kind: "number", default: "100" },
  ],
};


/** All attributes offered for a block kind (specific first, then globals). */
export function attrsForKind(kind: BlockKind): AttrSpec[] {
  return [...(SPECIFIC[kind] ?? []), ...GLOBAL_ATTRS];
}

export function isKnownAttr(kind: BlockKind, name: string) {
  return attrsForKind(kind).some((a) => a.name === name);
}
