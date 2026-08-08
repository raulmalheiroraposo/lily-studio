import { Window } from "happy-dom";
const w = new Window();
(globalThis as any).DOMParser = w.DOMParser;
const { parseComponentTsx } = await import("/dev-server/src/lib/tsx-importer.ts");
const { blocksToTsx } = await import("/dev-server/src/lib/tsx-generator.ts");
const src = `import { useState } from "react";

export default function Counter() {
  const [c, setC] = useState(0);

  return (
    <div style={{"position":"relative","width":"100%","minHeight":"200px"}}>
      <div data-block-id="b1" style={{"position":"absolute","left":"24px","top":"24px","width":"200px","height":"40px"}}>
        <button type="button" onClick={() => setC(c + 1)} data-x="1" style={{"width":"100%","height":"100%"}}>Contar</button>
      </div>
    </div>
  );
}`;
const blocks = [{ id:"b1", kind:"button", x:24,y:24,w:200,h:40, props:{}, style:{}, attrs:{}, text:"Contar", events:[] } as any];
const parsed = parseComponentTsx(src, blocks);
console.log(JSON.stringify(parsed.blocks, null, 1));
console.log(blocksToTsx("Counter", parsed.blocks, src));
