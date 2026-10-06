/* Download do executável desktop do Lily Studio (gerado pelo GitHub Actions em .github/workflows/desktop.yml). */

/** Repositório GitHub no formato "usuario/repositorio". */
export const GITHUB_REPO = "";

function platform() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Windows/i.test(ua)) return "win32";
  if (/Mac/i.test(ua)) return "darwin";
  return "linux";
}

export function downloadDesktopApp(): string {
  if (!GITHUB_REPO) {
    return "O download do executável ficará disponível assim que o repositório do GitHub for configurado no Lily Studio.";
  }
  const file = `Lily-Studio-${platform()}-x64.zip`;
  window.open(`https://github.com/${GITHUB_REPO}/releases/download/desktop-latest/${file}`, "_blank");
  return `Baixando ${file}. Extraia o ZIP e abra o Lily Studio.`;
}
