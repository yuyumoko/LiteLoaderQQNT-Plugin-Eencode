const { ipcMain, shell, dialog, app, BrowserWindow } = require("electron");

const fs = require("fs");
const path = require("path");
const request = require("request");

const IpcHandle = require("./utils/ipcHandle");
const { imageInfo, checkSig } = require("./core/imageInfo");
const Config = require("./core/config");

const AES = require("./core/AES");

const { Updater } = require("./core/updater");

const { calcDirSizeStr } = require("./utils/tools");

const peer = {};
const pendingCallbacks = {};

const PNG_HEARD = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52,
]);

let cached = {
  autoDecrypt: true,
  AESKey: "",
  groupEncryptMode: "",
  autoDecryptImageLimit: 0,
  autoDecryptVideoLimit: 0,
};

let currentRequest;

// 加载插件时触发
async function onLoad(plugin) {
  const cachePath = path.join(plugin.path.data, "cache");

  const _config = new Config(plugin.path.data);
  const config = _config.load();

  const ipcHandle = new IpcHandle(config.manifest.slug);

  const updater = new Updater(plugin.path.plugin);

  cached.autoDecrypt = config.autoDecrypt;
  cached.AESKey = config.encryptConfig.AES.key;
  cached.groupEncryptMode = config.groupEncryptMode;
  cached.autoDecryptImageLimit = config.autoDecryptImageLimit;
  cached.autoDecryptVideoLimit = config.autoDecryptVideoLimit;

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

  if (!fs.existsSync(path.join(cachePath, "decrypt"))) {
    fs.mkdirSync(path.join(cachePath, "decrypt"), { recursive: true });
  }

  ipcHandle.fn("restart", (event) => {
    app.relaunch();
    app.exit(0);
  });

  ipcHandle.fn("getPeer", (event) => peer);

  ipcHandle.fn("OpenWeb", (event, url) => shell.openExternal(url));
  ipcHandle.fn("OpenCacheDir", (event) => shell.openPath(cachePath));
  ipcHandle.fn("GetCacheSize", (event) => calcDirSizeStr(cachePath));

  ipcHandle.fn("checkUpdate", async (event) => await updater.check());
  ipcHandle.fn("installUpdate", async (event) => await updater.install());

  ipcHandle.fn("uploadUguuImage", (event, imgUrl, isFile) => {
    try {
      return new Promise((resolve, reject) => {
        const r = request.post(
          "https://uguu.se/upload.php",
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
            },
          },
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              body = JSON.parse(body);
              resolve(body.files[0].url);
            } else {
              reject(error);
            }
          }
        );
        currentRequest = r;
        const form = r.form();

        let filename = path.basename(imgUrl).toLowerCase();
        if (filename.endsWith(".null")) {
          const format = imageInfo(fs.readFileSync(imgUrl)).format;
          filename = filename.replace(".null", "." + format);
        }

        let imgData = fs.readFileSync(imgUrl);
        if (isFile) {
          imgData = Buffer.concat([PNG_HEARD, imgData]);
          filename += ".png";
        }

        form.append("files[]", imgData, {
          filename,
        });
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
          // Linux 下文件及目录区分大小写 不能将文件路径toLower 只对filename toLower
          // url = url.toLowerCase();
          let filename = path.basename(url).toLowerCase();
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

  ipcHandle.fn(
    "AbortCurrentRequest",
    (event) => currentRequest && currentRequest.abort()
  );

  ipcHandle.fn("DownloadFile", async (event, url, filename) => {
    return new Promise((resolve, reject) => {
      const fileDir = path.join(cachePath, "download");
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

  ipcHandle.fn("getFileStatSync", (event, filePath) => {
    const fileInfo = fs.statSync(filePath);
    fileInfo.name = path.basename(filePath);
    return fileInfo;
  });
  ipcHandle.fn("readFileSync", (event, filePath) => fs.readFileSync(filePath));
  ipcHandle.fn("deleteFileSync", (event, filePath) => fs.unlinkSync(filePath));
  ipcHandle.fn("existsSync", (event, filePath) => fs.existsSync(filePath));
  ipcHandle.fn("renameSync", (event, oldPath, newPath) =>
    fs.renameSync(oldPath, newPath)
  );
  ipcHandle.fn("copyFileSync", (event, oldPath, newPath) =>
    fs.copyFileSync(oldPath, newPath)
  );

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
      return defaultKey;
    }

    return AES.generateKeyByStr(`${uid}`, config.encryptConfig.AES.iv_length);
  });

  ipcHandle.fn(
    "EncryptFile",
    async (event, filePath, encryptType, key = null, iv = null) => {
      const fileDir = path.join(cachePath, "encrypt");
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      if (!key) {
        key = cached.AESKey;
      }

      if (!iv) {
        iv = key.substring(0, config.encryptConfig.AES.iv_length);
      }

      const pathInfo = path.parse(filePath);
      const encryptName = `pge-${AES.encrypt(
        pathInfo.name + pathInfo.ext,
        key,
        iv.length,
        "hex",
        true
      )}`;
      const encryptFilePath = path.join(fileDir, encryptName);

      await AES.encryptFile(filePath, encryptFilePath, key, iv);
      return encryptFilePath;
    }
  );

  ipcHandle.fn(
    "DecryptFile",
    async (event, filePath, decryptType, key = null, iv = null) => {
      if (!key) {
        key = cached.AESKey;
      }

      if (!iv) {
        iv = key.substring(0, config.encryptConfig.AES.iv_length);
      }

      const pathInfo = path.parse(filePath);

      let pathInfoName = pathInfo.name;
      if (pathInfoName.startsWith("pge-")) {
        pathInfoName = pathInfoName.slice(
          config.encryptConfig.AES.prefix.length
        );
      }

      const decryptName = AES.decrypt(pathInfoName, key, iv.length);
      const decryptFilePath = path.join(pathInfo.dir, decryptName);
      await AES.decryptFile(filePath, decryptFilePath, key, iv);
      return decryptFilePath;
    }
  );
}

// 创建窗口时触发
function onBrowserWindowCreated(window, plugin) {
  const original_send = window.webContents.send;
  const patched_send = (channel, ...args) => {
    // if (args?.[1]?.[0]?.cmdName) {
    //   console.log(args?.[1]?.[0]?.cmdName);
    // }

    // if (args?.[1]?.[0]?.cmdName == "nodeIKernelMsgListener/onAddSendMsg")
    // console.log(args?.[1]?.[0]?.cmdName)
    //     console.log(printObject(args))

    // nodeIKernelMsgListener/onRichMediaUploadComplete
    // if (
    //   args?.[1]?.[0]?.cmdName ===
    //   "nodeIKernelMsgListener/onRichMediaProgerssUpdate"
    // ) {
    //   console.log("onRichMediaProgerssUpdate !!!!!");
    //   window.webContents.send("media-progerss-update", args);
    // }
    if (
      args?.[1]?.[0]?.cmdName ===
      "nodeIKernelMsgListener/onRichMediaUploadComplete"
    ) {
      // console.log("onRichMediaUploadComplete !!!!!");
      window.webContents.send("media-progerss-update", args);
    }

    if (
      args?.[1]?.[0]?.cmdName ===
      "nodeIKernelMsgListener/onRichMediaDownloadComplete"
    ) {
      window.webContents.send("media-progerss-update", args);
    }

    if (args[0]?.callbackId) {
      const id = args[0].callbackId;
      if (id in pendingCallbacks) {
        window.webContents.send(pendingCallbacks[id], args[1]);
        delete pendingCallbacks[id];
      }
    }

    return original_send.call(window.webContents, channel, ...args);
  };

  window.webContents.send = patched_send;

  function ipc_message(_, status, name, ...args) {
    if (name !== "___!log" && args[0][1] && args[0][1][0] != "info") {
      // const event = args[0][0];
      const data = args[0][1];
      switch (data?.[0]) {
        case "nodeIKernelMsgService/setMsgRead":
          const msgPeer = data[1]?.peer;
          peer.uid = msgPeer.peerUid;
          peer.guildId = msgPeer.guildId;
          peer.chatType =
            msgPeer.chatType == 1
              ? "friend"
              : msgPeer.chatType == 2
              ? "group"
              : "others";
          break;
      }
    }
  }

  const ipc_message_proxy =
    window.webContents._events["-ipc-message"]?.[0] ||
    window.webContents._events["-ipc-message"];

  const proxyEvents = new Proxy(ipc_message_proxy, {
    // 拦截函数调用
    apply(target, thisArg, argumentsList) {
      /**
        if (argumentsList[3][1] && argumentsList[3][1][0] && argumentsList[3][1][0].includes("fetchGetHitEmotionsByWord")) {
            // 消息内容数据
            // 消息内容
            //output(content.msgElements[0].textElement.content)
            //content.msgElements[0].textElement.content = "测试"
            output("ipc-msg被拦截", argumentsList[3][1][1].inputWordInfo.word);
        }
         */
      ipc_message(...argumentsList);
      return target.apply(thisArg, argumentsList);
    },
  });

  if (window.webContents._events["-ipc-message"][0]) {
    window.webContents._events["-ipc-message"][0] = proxyEvents;
  } else {
    window.webContents._events["-ipc-message"] = proxyEvents;
  }

  window.webContents.on("ipc-message-sync", (event, channel, ...args) => {
    if (channel == "___!boot") {
      event.returnValue = {
        enabled: true,
        webContentsId: window.webContents.id.toString(),
      };
    }
  });
}

onLoad(LiteLoader.plugins["eencode"]);

module.exports = {
  onBrowserWindowCreated,
};
