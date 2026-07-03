export function ReactBlock({ code }: { code: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-primary/40 bg-primary/5">
      <div className="border-b border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
        Componente React (preview do código)
      </div>
      <pre className="flex-1 overflow-auto p-2 text-[10px] leading-snug text-foreground/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}