const { ipcMain, shell, dialog, app } = require("electron");

const fs = require("fs");
const path = require("path");
const request = require("request");

const IpcHandle = require("./utils/ipcHandle");
const { imageInfo, checkSig } = require("./core/imageInfo");
const Config = require("./core/config");

const AES = require("./core/AES");

const { Updater } = require("./core/updater");

const { calcDirSizeStr } = require("./utils/tools");


const PNG_HEARD = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

let cached = {
  autoDecrypt: true,
  AESKey: "",
  groupEncryptMode: "",
};

let currentRequest;

// 加载插件时触发
async function onLoad(plugin) {
  const cachePath = plugin.path.cache;
  
  const _config = new Config(plugin.path.data);
  const config = _config.load();

  const ipcHandle = new IpcHandle(config.manifest.slug);

  const updater = new Updater(plugin.path.plugin)
  
  
  cached.autoDecrypt = config.autoDecrypt;
  cached.AESKey = config.encryptConfig.AES.key;
  cached.groupEncryptMode = config.groupEncryptMode;


  if (config.autoDeleteCache && fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true });
    } catch (error) {
      dialog.showMessageBox({
        type: "warning",
        title: "警告",
        message: `歪比巴卜插件删除文件失败, 可能是没权限: ${error.message}`,
        buttons: ["确定"],
        cancelId: 1,
      });
    }
  }

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }

  ipcHandle.fn("restart", (event) => {
    app.relaunch();
    app.exit(0);
  });

  ipcHandle.fn("OpenWeb", (event, url) => shell.openExternal(url));
  ipcHandle.fn("OpenCacheDir", (event) => shell.openPath(cachePath));
  ipcHandle.fn("GetCacheSize", (event) => calcDirSizeStr(cachePath));

  ipcHandle.fn("checkUpdate", async (event) => await updater.check()); 
  ipcHandle.fn("installUpdate", async (event) => await updater.install());

  ipcHandle.fn("uploadChkajaImage", (event, host, imgUrls, isFile = null) => {
    try {
      return new Promise((resolve, reject) => {
        const r = request.post(host, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(body);
          } else {
            reject(error);
          }
        });
        currentRequest = r;

        const form = r.form();
        form.append("MAX_FILE_SIZE", "8388608");
        form.append("viewpassword", "");
        form.append("viewtips", "");
        form.append("Timelimit", "");
        form.append("Countlimit", "");
        form.append("submit", "submit");
        for (let url of imgUrls) {
          url = url.toLowerCase();
          let filename = path.basename(url);
          if (filename.endsWith(".null")) {
            const format = imageInfo(fs.readFileSync(url)).format;
            filename = filename.replace(".null", "." + format);
          }

          let imgData = fs.readFileSync(url);
          if (isFile) {
            imgData = Buffer.concat([PNG_HEARD, imgData]);
            filename += ".png";
          }

          form.append("files[]", imgData, {
            filename,
          });
        }
      });
    } catch (error) {
      log(error);
      dialog.showMessageBox({
        type: "warning",
        title: "警告",
        message: "上传图床失败",
        buttons: ["确定"],
        cancelId: 1,
      });
      return {};
    }
  });

  ipcHandle.fn("AbortCurrentRequest", (event) => currentRequest && currentRequest.abort());

  ipcHandle.fn("DownloadFile", async (event, url, filename) => {
    return new Promise((resolve, reject) => {
      const fileDir = path.join(plugin.path.cache, "download");
      let filePath = path.join(fileDir, filename);

      if (fs.existsSync(filePath)) {
        resolve(filePath);
        return;
      }

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      request
        .get(url)
        .on("error", (err) => {
          dialog.showMessageBox({
            type: "warning",
            title: "警差",
            message: "下載失敗",
            buttons: ["确定"],
            cancelId: 1,
          });
        })
        .pipe(fs.createWriteStream(filePath))
        .on("finish", () => {
          resolve(filePath);
        });
    });
  });

  ipcHandle.fn("FixVideoFile", async (event, filePath) => {
    let rawData = fs.readFileSync(filePath);
    if (!checkSig(rawData, 0, [0x89, 0x50, 0x4e, 0x47])) {
      return;
    }
    fs.unlinkSync(filePath);
    rawData = rawData.subarray(PNG_HEARD.length);
    fs.writeFileSync(filePath, rawData);
  });

  ipcHandle.fn("readFileSync", (event, filePath) => fs.readFileSync(filePath));
  ipcHandle.fn("existsSync", (event, filePath) => fs.existsSync(filePath));

  ipcHandle.fn("GetConfig", (event) => _config.load());
  ipcHandle.fn("GetDefaultConfig", (event) => Config.default);
  ipcHandle.fn("SetConfig", (event, name, data, setCache = false) => {
    _config.set(name, data);
    if (setCache) {
      cached[name] = data;
    }
  });

  ipcHandle.fn("GetCache", (event) => cached);
  ipcHandle.fn("SetCache", (event, name, data) => {
    cached[name] = data;
  });

  ipcHandle.fn("SetAESKey", (event, AESKey) => {
    cached.AESKey = AESKey;
    _config.set("encryptConfig.AES.key", AESKey);
  });

  ipcHandle.fn("AES_encrypt", (event, text, key) =>
    AES.encrypt(text, key, config.encryptConfig.AES.iv_length)
  );
  ipcHandle.fn("AES_decrypt", (event, text, key) =>
    AES.decrypt(text, key, config.encryptConfig.AES.iv_length)
  );
  ipcHandle.fn("AES_generateKeyByStr", (event, text) =>
    AES.generateKeyByStr(text)
  );
  ipcHandle.fn("AES_customKey", (event, chatType, uid) => {
    let defaultKey = cached.AESKey;
    if (chatType !== "group") {
      return defaultKey
    }

    return AES.generateKeyByStr(`${uid}`, config.encryptConfig.AES.iv_length);
  });



  ipcHandle.fn(
    "EncryptFile",
    async (event, filePath, encryptType, key = null, iv = null) => {
      const pathInfo = path.parse(filePath);
      const encryptFilePath = path.join(pathInfo.dir, pathInfo.name + ".enc" + pathInfo.ext);

      if (!key) {
        key = cached.AESKey;
      }

      if (!iv) {
        iv = key.substring(0, config.encryptConfig.AES.iv_length);
      }
      await AES.encryptFile(filePath, encryptFilePath, key, iv);
      return encryptFilePath;
    }
  );

  ipcHandle.fn(
    "DecryptFile",
    async (event, filePath, decryptType, key = null, iv = null) => {
      const pathInfo = path.parse(filePath);
      const decryptFilePath = path.join(pathInfo.dir, pathInfo.base.replace(".enc", ""));

      if (!key) {
        key = cached.AESKey;
      }

      if (!iv) {
        iv = key.substring(0, config.encryptConfig.AES.iv_length);
      }
      await AES.decryptFile(filePath, decryptFilePath, key, iv);
      return decryptFilePath;
    }
  );

}

// 创建窗口时触发
function onBrowserWindowCreated(window, plugin) {}

// 这两个函数都是可选的
module.exports = {
  onLoad,
  onBrowserWindowCreated,
};
