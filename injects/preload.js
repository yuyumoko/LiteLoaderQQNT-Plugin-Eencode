// Electron 主进程 与 渲染进程 交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");

const event_prefix = `LiteLoader`;
const slug = "eencode";

const get_fn_key = (func_name) => `${event_prefix}.${slug}.${func_name}`;

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld(slug, {
  ipcRenderer_en: ipcRenderer,
  ipcRenderer_en_on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },

  restart: () => ipcRenderer.invoke(get_fn_key("restart")),

  getPeer: () => ipcRenderer.invoke(get_fn_key("getPeer")),

  OpenWeb: (url) => ipcRenderer.invoke(get_fn_key("OpenWeb"), url),
  OpenCacheDir: () => ipcRenderer.invoke(get_fn_key("OpenCacheDir")),
  GetCacheSize: () => ipcRenderer.invoke(get_fn_key("GetCacheSize")),

  checkUpdate: () => ipcRenderer.invoke(get_fn_key("checkUpdate")),
  installUpdate: () => ipcRenderer.invoke(get_fn_key("installUpdate")),

  uploadChkajaImage: (host, imgUrls, isFile) =>
    ipcRenderer.invoke(get_fn_key("uploadChkajaImage"), host, imgUrls, isFile),

  AbortCurrentRequest: () =>
    ipcRenderer.invoke(get_fn_key("AbortCurrentRequest")),

  DownloadFile: (url, filename) =>
    ipcRenderer.invoke(get_fn_key("DownloadFile"), url, filename),

  FixVideoFile: (filePath) =>
    ipcRenderer.invoke(get_fn_key("FixVideoFile"), filePath),

  getFileStatSync: (filePath) =>
    ipcRenderer.invoke(get_fn_key("getFileStatSync"), filePath),
  readFileSync: (filePath) =>
    ipcRenderer.invoke(get_fn_key("readFileSync"), filePath),
  deleteFileSync: (filePath) =>
    ipcRenderer.invoke(get_fn_key("deleteFileSync"), filePath),
  existsSync: (filePath) =>
    ipcRenderer.invoke(get_fn_key("existsSync"), filePath),
  renameSync: (oldPath, newPath) =>
    ipcRenderer.invoke(get_fn_key("renameSync"), oldPath, newPath),
  copyFileSync: (oldPath, newPath) =>
    ipcRenderer.invoke(get_fn_key("copyFileSync"), oldPath, newPath),

  GetConfig: () => ipcRenderer.invoke(get_fn_key("GetConfig")),
  GetDefaultConfig: () => ipcRenderer.invoke(get_fn_key("GetDefaultConfig")),
  SetConfig: (name, data, setCache) =>
    ipcRenderer.invoke(get_fn_key("SetConfig"), name, data, setCache),

  GetCache: () => ipcRenderer.invoke(get_fn_key("GetCache")),
  SetCache: (name, data) =>
    ipcRenderer.invoke(get_fn_key("SetCache"), name, data),

  SetAESKey: (key) => ipcRenderer.invoke(get_fn_key("SetAESKey"), key),

  AES_encrypt: (text, key) =>
    ipcRenderer.invoke(get_fn_key("AES_encrypt"), text, key),
  AES_decrypt: (text, key) =>
    ipcRenderer.invoke(get_fn_key("AES_decrypt"), text, key),
  AES_customKey: (chatType, uid) =>
    ipcRenderer.invoke(get_fn_key("AES_customKey"), chatType, uid),

  EncryptFile: (filePath, encryptType, key, iv) =>
    ipcRenderer.invoke(
      get_fn_key("EncryptFile"),
      filePath,
      encryptType,
      key,
      iv
    ),

  DecryptFile: (filePath, decryptType, key, iv) =>
    ipcRenderer.invoke(
      get_fn_key("DecryptFile"),
      filePath,
      decryptType,
      key,
      iv
    ),
});


const convertor = new Map();

let { webContentsId } = ipcRenderer.sendSync('___!boot');
if (!webContentsId) {
    webContentsId = 2;
}
