// 运行在 Electron 渲染进程 下的页面脚本
const {
  plugin: pluginPath,
  data: dataPath,
  cache: cachePath,
} = LiteLoader.plugins.eencode.path;
const ipcRenderer_on = eencode.ipcRenderer_en_on;

class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  once(eventName, listener) {
    const onceListener = (...args) => {
      listener(...args);
      this.off(eventName, onceListener);
    };
    this.on(eventName, onceListener);
  }

  off(eventName, listener) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(
        (fn) => fn !== listener
      );
    }
  }

  emit(event, ...args) {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach((listener) => {
        listener(...args);
      });
    }
  }
}

const EnEvent = new EventEmitter();

class RequireApi {
  constructor(pluginPath) {
    this.srcDir = `llqqnt://local-file/${pluginPath}`;
  }

  resolve(filePath, root = "src") {
    return `${this.srcDir}/${root}/${filePath}`;
  }

  async read(filePath, root = "src") {
    return await (await fetch(this.resolve(filePath, root))).text();
  }
}

const requireApi = new RequireApi(pluginPath);
let config;

function showMsg(msg, type = "success", timer = 1500) {
  const opt = {
    icon: type,
    title: msg,
    showConfirmButton: false
  }
  if (timer !== -1) {
    opt.timer = timer
  }
  Swal.fire(opt);
}

// 初始化函数
const decodeMsgAPI = eval(
  await requireApi.read("renderer_helper/decodeMsg.js", "injects")
)();

const encodeMsgAPI = eval(
  await requireApi.read("renderer_helper/encodeMsg.js", "injects")
)();

const encodeMenuAPI = eval(
  await requireApi.read("renderer_helper/encodeMenu.js", "injects")
)();

async function destructFileElement(filePath) {
  const fileInfo = await eencode.getFileStatSync(filePath);
  return {
    elementType: 3,
    elementId: "",
    fileElement: {
      fileName: fileInfo.name,
      filePath: filePath,
      fileSize: `${fileInfo.size}`,
    },
  };
}

// 初始化加密按钮
let initSendButtonFlag;
let observerBtnFlag;

async function initSendButton() {
  if (initSendButtonFlag) return;
  initSendButtonFlag = true;

  const buttonHtmlText = await requireApi.read("view/SendButton.html");
  const operation = document.querySelector(".operation");
  operation.insertAdjacentHTML("afterbegin", buttonHtmlText);

  const buttonEncode = document.querySelector(".eencode-send-button");

  buttonEncode.addEventListener("click", async () => {
    const ck_editor = document.querySelector(".ck-editor__main");
    const p_editor = ck_editor.firstElementChild;

    const cached = await eencode.GetCache();
    const peer = await LLAPI.getPeer();
    let AESKey;

    if (cached.groupEncryptMode === "groupId") {
      AESKey = await eencode.AES_customKey(peer.chatType, peer.uid);
    } else {
      AESKey = cached.AESKey;
    }

    await encodeMsgAPI.sendEncodeMessage(p_editor, AESKey, peer);
  });
  if (!observerBtnFlag)
  {
    observerBtnFlag = true;
    let observer_btn = new MutationObserver(async (mutationRecords) => {
      if (document.querySelector(".operation")) {
        initSendButtonFlag = !!document.querySelector(".eencode-send-button");
        if (!initSendButtonFlag) await initSendButton();
      }
    });
    observer_btn.observe(document.querySelector(".operation").parentElement, {
      childList: true,
    });
    // (async () => {
      
    // })()
  }
}

function decodeMsgContainer(msgContainer, interval) {
  if (msgContainer.length > 0) {
    clearInterval(interval);
    for (let node of msgContainer) {
      decodeMsgAPI.messageHandler(node, true);
    }
  }
}

// 页面加载完成时触发
async function onLoad() {
  const interval = setInterval(async () => {
    // 转发界面解密
    if (window.location.hash.startsWith("#/forward/")) {
      const msgContainer = document.querySelectorAll(
        ".scroll-view--show-scrollbar .message-content__wrapper"
      );
      decodeMsgContainer(msgContainer, interval);
    }
    // 历史记录
    else if (window.location.hash.startsWith("#/record")) {
      const msgContainer = document.querySelectorAll(".record-msg-detail");
      decodeMsgContainer(msgContainer, interval);

      let observer = new MutationObserver((mutationRecords) => {
        for (let records of mutationRecords) {
          for (let node of records.addedNodes) {
            decodeMsgContainer(
              node.querySelectorAll(".message-content__wrapper"),
              interval
            );
          }
        }
      });
      observer.observe(document.querySelector(".scroll-view--show-scrollbar"), {
        childList: true,
      });
    } else if (window.location.href.indexOf("#/blank") == -1) {
      clearInterval(interval);
    }
  }, 100);

  config = await eencode.GetConfig();
  initSendButtonFlag = !!document.querySelector(".eencode-send-button");

  // 插入设置页样式
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = requireApi.resolve("view/decodeMsg.css");
  document.head.appendChild(link);
  
  LLAPI.on("dom-up-messages", async (node) => {
    await initSendButton();
    await decodeMsgAPI.messageHandler(node);
  });

  LLAPI.on("context-msg-menu", (event) => encodeMenuAPI(event));
  document.addEventListener("contextmenu", (event) => {
    var element = document.querySelector(".main-area__image");
    if (element == null) return;
    if (location.href.includes("/imageViewer")) {
      encodeMenuAPI(event, true);
    }
  });

  
}

// 打开设置界面时触发
async function onConfigView(view) {
  // 插入设置页
  const htmlText = await requireApi.read("view/ConfigView.html");
  view.insertAdjacentHTML("afterbegin", htmlText);

  // 插入设置页样式
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = requireApi.resolve("view/ConfigView.css");
  document.head.appendChild(link);

  const configViewJS = await requireApi.read("view/ConfigView.js");
  eval(configViewJS);
}

ipcRenderer_on("media-progerss-update", (event, args) => {
  const notifyInfo = args[1]?.[0]?.payload?.notifyInfo;
  if (notifyInfo) {
    EnEvent.emit("media-progerss-update-" + notifyInfo.totalSize, notifyInfo);
  }
});

export { onLoad, onConfigView };
