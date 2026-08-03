import { Component, useEffect, useState, type ReactNode } from "react";
import { compileComponent, type CompiledComponent } from "@/lib/jsx-compiler";

class Boundary extends Component<{ children: ReactNode; onError: (m: string) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    this.props.onError(err instanceof Error ? err.message : String(err));
  }
  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function ReactBlock({
  code,
  eventHandlers,
}: {
  code: string;
  eventHandlers?: Record<string, (e: unknown) => void>;
}) {
  const [Comp, setComp] = useState<CompiledComponent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    compileComponent(code)
      .then((c) => alive && setComp(() => c))
      .catch((e: unknown) => {
        if (!alive) return;
        setComp(null);
        setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      alive = false;
    };
  }, [code]);

  if (error) {
    return (
      <div className="h-full w-full overflow-auto rounded border border-destructive/60 bg-destructive/10 p-2 text-[10px] leading-snug text-destructive">
        <div className="font-semibold">Erro no componente React</div>
        <pre className="whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto" {...(eventHandlers ?? {})}>
      {Comp ? (
        <Boundary onError={setError}>
          <Comp />
        </Boundary>
      ) : (
        <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
          compilando…
        </div>
      )}
    </div>
  );
}
