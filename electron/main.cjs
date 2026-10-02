// Lily Studio — app desktop (Electron). Serve o editor compilado e permite iniciar o site em servidor local.
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
};

function serveDir(root, fallback, port = 0) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      let file = path.join(root, path.normalize(p));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = fallback ? path.join(root, fallback) : file;
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); return res.end("Não encontrado"); }
        res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    srv.listen(port, "127.0.0.1", () => resolve(`http://127.0.0.1:${srv.address().port}/`));
  });
}

let siteUrl = null;
ipcMain.handle("lily:start-server", async (_e, files) => {
  const dir = path.join(app.getPath("userData"), "site");
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(files)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  if (!siteUrl) siteUrl = await serveDir(dir, null, 5173).catch(() => serveDir(dir, null, 0));
  shell.openExternal(siteUrl);
  return siteUrl;
});

app.whenReady().then(async () => {
  const root = path.join(__dirname, "..", "dist", "client");
  const shellFile = fs.existsSync(path.join(root, "_shell.html")) ? "_shell.html" : "index.html";
  const url = await serveDir(root, shellFile);
  const win = new BrowserWindow({
    width: 1400, height: 900, title: "Lily Studio",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    if (u.startsWith(url)) return { action: "allow" };
    shell.openExternal(u);
    return { action: "deny" };
  });
  win.loadURL(url);
});

app.on("window-all-closed", () => app.quit());
