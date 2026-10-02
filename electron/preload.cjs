const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lilyDesktop", {
  startServer: (files) => ipcRenderer.invoke("lily:start-server", files),
});
