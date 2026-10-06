/* Servidor local e app móvel para o site gerado pelo Lily Studio. */
import JSZip from "jszip";
import type { ProjectState } from "./types";
import { downloadBlob, fetchVendors, writeSite } from "./export-zip";
import type { LilyDesktopApi } from "./local-fs";

declare global {
  interface Window {
    lilyDesktop?: LilyDesktopApi;
  }
}

const SERVER_JS = `// Servidor local do site gerado pelo Lily Studio. Uso: node servidor.cjs [porta]
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = Number(process.argv[2]) || 5173;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, path.normalize(p).replace(/^([.][.][\\\\/])+/, ""));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Não encontrado"); }
    res.writeHead(200, { "content-type": (types[path.extname(file)] || "application/octet-stream") + "; charset=utf-8" });
    res.end(data);
  });
}).listen(port, () => console.log("Site do Lily Studio em http://localhost:" + port));
`;

async function siteFiles(project: ProjectState, extra?: (z: JSZip) => void) {
  const zip = new JSZip();
  writeSite(zip, project, await fetchVendors());
  extra?.(zip);
  return zip;
}

/** Inicia o site em um servidor local (app desktop) ou baixa um pacote pronto para rodar. */
export async function startLocalServer(project: ProjectState): Promise<string> {
  if (window.lilyDesktop) {
    const zip = await siteFiles(project);
    const map: Record<string, string> = {};
    for (const [p, f] of Object.entries(zip.files)) if (!f.dir) map[p] = await f.async("string");
    const url = await window.lilyDesktop.startServer(map);
    window.open(url, "_blank");
    return `Servidor local iniciado em ${url}`;
  }
  const zip = await siteFiles(project, (z) => {
    z.file("servidor.cjs", SERVER_JS);
    z.file("iniciar-servidor.bat", "@echo off\r\nstart http://localhost:5173\r\nnode servidor.cjs 5173\r\n");
    z.file("iniciar-servidor.sh", "#!/bin/sh\ncd \"$(dirname \"$0\")\"\n(sleep 1; xdg-open http://localhost:5173 || open http://localhost:5173) >/dev/null 2>&1 &\nnode servidor.cjs 5173\n");
  });
  downloadBlob(await zip.generateAsync({ type: "blob" }), "site-servidor-local.zip");
  return "O navegador não pode iniciar servidores. Baixamos o site com um servidor: extraia e execute iniciar-servidor (requer Node.js). No app desktop do Lily Studio o servidor inicia direto.";
}

/** Gera um projeto de app móvel (PWA instalável + projeto Capacitor para Android/iOS). */
export async function buildMobileApp(project: ProjectState, appName = "Meu App Lily") {
  const appId = "com.lilystudio." + (appName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app");
  const zip = new JSZip();
  const www = zip.folder("www")!;
  writeSite(www, project, await fetchVendors());
  www.file(
    "manifest.webmanifest",
    JSON.stringify({ name: appName, short_name: appName, start_url: "./index.html", display: "standalone", background_color: "#ffffff", theme_color: "#111111", icons: [] }, null, 2)
  );
  www.file(
    "sw.js",
    `const C="lily-v1";self.addEventListener("install",e=>self.skipWaiting());self.addEventListener("fetch",e=>{e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{c.put(e.request,n.clone());return n}))))});`
  );
  // Injeta manifest e service worker em cada página
  for (const [p, f] of Object.entries(www.files)) {
    if (f.dir || !p.endsWith(".html")) continue;
    const name = p.slice(p.lastIndexOf("/") + 1);
    const html = await f.async("string");
    www.file(
      name,
      html.replace(
        "</head>",
        `<meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="manifest" href="manifest.webmanifest" /><script>if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js")</script></head>`
      )
    );
  }
  zip.file("capacitor.config.json", JSON.stringify({ appId, appName, webDir: "www" }, null, 2));
  zip.file(
    "package.json",
    JSON.stringify(
      {
        name: appId.split(".").pop(),
        private: true,
        scripts: {
          setup: "npx cap add android && npx cap add ios",
          android: "npx cap sync android && npx cap open android",
          ios: "npx cap sync ios && npx cap open ios",
        },
        dependencies: { "@capacitor/core": "^6.0.0", "@capacitor/android": "^6.0.0", "@capacitor/ios": "^6.0.0" },
        devDependencies: { "@capacitor/cli": "^6.0.0" },
      },
      null,
      2
    )
  );
  zip.file(
    "LEIA-ME.md",
    `# ${appName} — app móvel gerado pelo Lily Studio

## Opção 1: PWA (sem instalar nada)
Hospede a pasta \`www/\` em qualquer servidor (ou use o servidor local do Lily Studio) e abra no celular.
Use "Adicionar à tela inicial" — o site funciona como app e offline.

## Opção 2: app nativo (Android/iOS) com Capacitor
Requer Node.js e Android Studio (Android) ou Xcode no macOS (iOS).

\`\`\`
npm install
npm run setup
npm run android   # abre no Android Studio para gerar o APK
npm run ios       # abre no Xcode
\`\`\`
`
  );
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${appId.split(".").pop()}-app-movel.zip`);
}
