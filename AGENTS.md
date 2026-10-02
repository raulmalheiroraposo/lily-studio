<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Desktop build: `LILY_DESKTOP=1` switches TanStack Start to SPA mode and Electron (`electron/main.cjs`) serves `dist/client/_shell.html` over a local http server — avoids file:// and SSR issues.
- Local file I/O lives in `src/lib/local-fs.ts` (File System Access API with download/input fallbacks); site/mobile packaging in `src/lib/deploy.ts` reuses `writeSite` from export-zip — one site generator for all outputs.
