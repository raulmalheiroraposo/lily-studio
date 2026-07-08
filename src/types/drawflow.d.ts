declare module "drawflow" {
  export default class Drawflow {
    constructor(container: HTMLElement, render?: unknown, parent?: unknown);
    reroute: boolean;
    reroute_fix_curvature: boolean;
    start(): void;
    clear(): void;
    on(event: string, cb: (...args: unknown[]) => void): void;
    addNode(
      name: string,
      inputs: number,
      outputs: number,
      posx: number,
      posy: number,
      className: string,
      data: unknown,
      html: string,
      typenode?: boolean | string,
    ): number;
    removeNodeId(id: string): void;
    addConnection(idOutput: number, idInput: number, outputClass: string, inputClass: string): void;
    updateNodeDataFromId(id: number, data: unknown): void;
    getNodeFromId(id: number): unknown;
    export(): unknown;
    import(data: unknown): void;
  }
}