export type PropMap = Record<string, string | number | boolean>;

export type EventBinding = {
  event: string; // onClick, onChange, etc.
  flowId: string;
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
  text?: string;
  events: EventBinding[];
  code?: string; // JSX code for kind === "react"
};

export type ProjectFile = {
  id: string;
  name: string;
  type: "page" | "component" | "action";
  // For page/component: blocks. For action: flowId reference.
  blocks?: Block[];
  flowId?: string;
  code?: string;
};

export type ActionNodeKind =
  | "start"
  | "end"
  | "function"
  | "http"
  | "loop"
  | "control";

export type FlowNodeData = {
  label: string;
  kind: ActionNodeKind;
  code?: string;
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  condition?: string;
  iterations?: number;
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
};

export type Flow = {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  drawflow?: unknown;
};

export type ProjectState = {
  files: ProjectFile[];
  flows: Flow[];
  activeFileId: string | null;
  selectedBlockId: string | null;
  activeFlowId: string | null;
};