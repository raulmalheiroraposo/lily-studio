import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/project-store";
import { BlockRenderer } from "@/components/blocks/HtmlBlock";
import { runBinding } from "@/lib/script-runtime";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "Site publicado — Lily Studio" },
      {
        name: "description",
        content:
          "Visualize a página criada no Lily Studio em uma aba isolada, com scripts e eventos funcionando como no site final.",
      },
      { property: "og:title", content: "Site publicado — Lily Studio" },
      {
        property: "og:description",
        content: "Página do Lily Studio renderizada isoladamente, com eventos e scripts ativos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SitePage,
});

function SitePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const files = useProject((s) => s.files);
  const activeFileId = useProject((s) => s.activeFileId);
  const page =
    files.find((f) => f.id === activeFileId && f.type === "page") ??
    files.find((f) => f.type === "page") ??
    null;

  const resolveCode = useCallback(
    (block: { code?: string; sourceFileId?: string }) =>
      block.sourceFileId
        ? files.find((f) => f.id === block.sourceFileId)?.code ?? ""
        : block.code ?? "",
    [files]
  );

  const buildHandlers = useCallback(
    (block: { events: { event: string }[] }) => {
      const map: Record<string, (e: unknown) => void> = {};
      for (const ev of block.events) {
        const prev = map[ev.event];
        map[ev.event] = (e) => {
          prev?.(e);
          void runBinding(ev as never, files, e);
        };
      }
      return map;
    },
    [files]
  );

  if (!mounted) return <div className="min-h-screen bg-background" />;

  if (!page) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nenhuma página encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma página HTML no editor e abra o site novamente.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-background">
      {page.blocks?.map((block) => (
        <div
          key={block.id}
          style={{
            position: "absolute",
            left: block.x,
            top: block.y,
            width: block.w,
            height: block.h,
          }}
        >
          <BlockRenderer
            block={block}
            eventHandlers={buildHandlers(block)}
            resolvedCode={resolveCode(block)}
          />
        </div>
      ))}
    </main>
  );
}
