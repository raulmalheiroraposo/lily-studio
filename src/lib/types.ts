export type PropMap = Record<string, string | number | boolean>;

export type EventBinding =
  | {
      event: string;
      kind: "function";
      scriptId: string;
      functionName: string;
    }
  | {
      event: string;
      kind: "url";
      url: string;
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    };

export type BlockKind =
  | "div"
  | "section"
  | "heading"
  | "paragraph"
  | "button"
  | "input"
  | "image"
  | "link"
  | "chart-bar"
  | "chart-line"
  | "chart-pie"
  | "react";

export type Block = {
  id: string;
  kind: BlockKind;
  x: number;
  y: number;
  w: number;
  h: number;
  props: PropMap;
  style: Record<string, string>;
  attrs: Record<string, string>;
  text?: string;
  events: EventBinding[];
  code?: string; // JSX code for kind === "react"
};

export type ProjectFile = {
  id: string;
  name: string;
  type: "page" | "component" | "script";
  // For page/component: blocks. For script: source code.
  blocks?: Block[];
  code?: string;
};

export type ProjectState = {
  files: ProjectFile[];
  activeFileId: string | null;
  selectedBlockId: string | null;
};