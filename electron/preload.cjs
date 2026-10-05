const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lilyDesktop", {
  startServer: (files) => ipcRenderer.invoke("lily:start-server", files),
  openFolder: () => ipcRenderer.invoke("lily:open-folder"),
  openFiles: () => ipcRenderer.invoke("lily:open-files"),
  pickFolder: () => ipcRenderer.invoke("lily:pick-folder"),
  writeFile: (absPath, text) => ipcRenderer.invoke("lily:write-file", absPath, text),
  renameFile: (from, to) => ipcRenderer.invoke("lily:rename-file", from, to),
});
