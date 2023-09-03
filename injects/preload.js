// Electron 主进程 与 渲染进程 交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");

const event_prefix = `LiteLoader`;
const slug = "eencode";

const get_fn_key = (func_name) => `${event_prefix}.${slug}.${func_name}`;

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld(slug, {
  OpenWeb: (url) => ipcRenderer.invoke(get_fn_key("OpenWeb"), url),

  uploadChkajaImage: (
    host,
    imgUrls
  ) =>
    ipcRenderer.invoke(
      get_fn_key("uploadChkajaImage"),
      host,
      imgUrls
    ),

  GetConfig: () => ipcRenderer.invoke(get_fn_key("GetConfig")),
  GetDefaultConfig: () => ipcRenderer.invoke(get_fn_key("GetDefaultConfig")),
  SetConfig: (name, data) =>
    ipcRenderer.invoke(get_fn_key("SetConfig"), name, data),

  GetCache: () => ipcRenderer.invoke(get_fn_key("GetCache")),
  SetCache: (name, data) =>
    ipcRenderer.invoke(get_fn_key("SetCache"), name, data),

  SetAESKey: (key) => ipcRenderer.invoke(get_fn_key("SetAESKey"), key),

  AES_encrypt: (text, key) =>
    ipcRenderer.invoke(get_fn_key("AES_encrypt"), text, key),
  AES_decrypt: (text, key) =>
    ipcRenderer.invoke(get_fn_key("AES_decrypt"), text, key),
});
