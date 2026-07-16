import {
  Type,
  Square,
  MousePointer,
  TextCursorInput,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading,
  BarChart3,
  LineChart,
  PieChart,
  Box,
  Code2,
} from "lucide-react";
import { useProject } from "@/lib/project-store";
import type { BlockKind } from "@/lib/types";

const items: { kind: BlockKind; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { kind: "div", label: "Div", icon: Box, group: "HTML" },
  { kind: "section", label: "Section", icon: Square, group: "HTML" },
  { kind: "heading", label: "Título", icon: Heading, group: "HTML" },
  { kind: "paragraph", label: "Parágrafo", icon: Type, group: "HTML" },
  { kind: "button", label: "Botão", icon: MousePointer, group: "HTML" },
  { kind: "input", label: "Input", icon: TextCursorInput, group: "HTML" },
  { kind: "image", label: "Imagem", icon: ImageIcon, group: "HTML" },
  { kind: "link", label: "Link", icon: LinkIcon, group: "HTML" },
  { kind: "chart-bar", label: "Barras", icon: BarChart3, group: "Gráficos" },
  { kind: "chart-line", label: "Linha", icon: LineChart, group: "Gráficos" },
  { kind: "chart-pie", label: "Pizza", icon: PieChart, group: "Gráficos" },
  { kind: "react", label: "React", icon: Code2, group: "React" },
];

export function ComponentPalette() {
  const addBlock = useProject((s) => s.addBlock);
  const activeFile = useProject((s) =>
    s.activeFileId ? s.files.find((f) => f.id === s.activeFileId) : null
  );
  const disabled = !activeFile || activeFile.type === "script";

  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
          <div className="grid grid-cols-2 gap-2">
            {items.filter((i) => i.group === g).map((i) => (
              <button
                key={i.kind}
                disabled={disabled}
                onClick={() => addBlock(i.kind)}
                className="group flex flex-col items-center gap-1 rounded-md border border-border bg-card px-2 py-3 text-xs text-foreground transition hover:border-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <i.icon className="h-4 w-4 text-primary" />
                {i.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}