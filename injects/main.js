const { ipcMain, shell, dialog } = require("electron");

const fs = require("fs");
const path = require("path");
const request = require("request");

const manifest = require("../manifest.json");

const IpcHandle = require("./utils/ipcHandle");
const imageInfo = require("./core/imageInfo");
const Config = require("./core/config");

const AES = require("./core/AES");

let cached = {
  autoDecrypt: true,
  AESKey: "",
};

// 加载插件时触发
async function onLoad(plugin) {
  const config = new Config(plugin.path.data);

  const ipcHandle = new IpcHandle(manifest.slug);

  const configData = config.load();
  cached.autoDecrypt = configData.autoDecrypt;
  cached.AESKey = configData.encryptConfig.AES.key;

  ipcHandle.fn("OpenWeb", (event, url) => shell.openExternal(url));

  ipcHandle.fn("uploadChkajaImage", (event, host, imgUrls) => {
    try {
      return new Promise((resolve, reject) => {
        const r = request.post(host, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            resolve(body);
          } else {
            reject(error);
          }
        });

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
            const format = imageInfo(fs.readFile(url)).format;
            filename = filename.replace(".null", "." + format);
          }

          form.append("files[]", fs.createReadStream(url), {
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

  ipcHandle.fn("GetConfig", (event) => config.load());
  ipcHandle.fn("GetDefaultConfig", (event) => Config.default);
  ipcHandle.fn("SetConfig", (event, name, data) => config.set(name, data));

  ipcHandle.fn("GetCache", (event) => cached);
  ipcHandle.fn("SetCache", (event, name, data) => {
    cached[name] = data;
  });

  ipcHandle.fn("SetAESKey", (event, AESKey) => {
    cached.AESKey = AESKey;
    config.set("encryptConfig.AES.key", AESKey);
  });

  ipcHandle.fn("AES_encrypt", (event, text, key) =>
    AES.encrypt(text, key, configData.encryptConfig.AES.iv_length)
  );
  ipcHandle.fn("AES_decrypt", (event, text, key) => AES.decrypt(text, key));
}

// 创建窗口时触发
function onBrowserWindowCreated(window, plugin) {}

// 这两个函数都是可选的
module.exports = {
  onLoad,
  onBrowserWindowCreated,
};
