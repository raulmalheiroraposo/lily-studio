// Lily Studio — app desktop (Electron). Serve o editor compilado e permite iniciar o site em servidor local.
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
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

// ---- Arquivos locais: o editor lê e grava direto na pasta original ----
const allowed = new Set();
const CODE_EXT = /\.(html?|tsx|jsx|js|ts|mjs|css|json)$/i;
const isAllowed = (p) => [...allowed].some((r) => p === r || p.startsWith(r + path.sep) || p.startsWith(r + "/"));
function walk(root, rel = "", out = { entries: [], dirs: [] }) {
  for (const ent of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
    const r = rel ? rel + "/" + ent.name : ent.name;
    if (ent.isDirectory()) { out.dirs.push(r); walk(root, r, out); }
    else if (CODE_EXT.test(ent.name)) out.entries.push({ path: r, text: fs.readFileSync(path.join(root, r), "utf8") });
  }
  return out;
}
ipcMain.handle("lily:open-folder", async () => {
  const r = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  const root = r.filePaths[0];
  allowed.add(root);
  return { root, name: path.basename(root), ...walk(root) };
});
ipcMain.handle("lily:pick-folder", async () => {
  const r = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
  if (r.canceled || !r.filePaths[0]) return null;
  allowed.add(r.filePaths[0]);
  return r.filePaths[0];
});
ipcMain.handle("lily:open-files", async () => {
  const r = await dialog.showOpenDialog({ properties: ["openFile", "multiSelections"], filters: [{ name: "Código", extensions: ["html", "htm", "tsx", "jsx", "js", "ts", "css", "json"] }] });
  if (r.canceled) return [];
  return r.filePaths.map((p) => { allowed.add(p); return { path: p, name: path.basename(p), text: fs.readFileSync(p, "utf8") }; });
});
ipcMain.handle("lily:write-file", async (_e, p, text) => {
  p = path.resolve(p);
  if (!isAllowed(p)) throw new Error("Caminho fora da pasta aberta");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
});
ipcMain.handle("lily:rename-file", async (_e, from, to) => {
  from = path.resolve(from); to = path.resolve(to);
  if (!isAllowed(from) || !isAllowed(to)) throw new Error("Caminho fora da pasta aberta");
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
});

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
