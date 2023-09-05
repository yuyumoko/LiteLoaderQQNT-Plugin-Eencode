// 运行在 Electron 渲染进程 下的页面脚本
const { plugin: pluginPath, data: dataPath, cache: cachePath } = LiteLoader.plugins.eencode.path;

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

// 初始化加密按钮
let initSendButtonFlag;
async function initSendButton() {
  if (initSendButtonFlag) return;
  initSendButtonFlag = true;

  const buttonHtmlText = await requireApi.read("view/SendButton.html");
  const operation = document.querySelector(".operation");
  operation.insertAdjacentHTML("afterbegin", buttonHtmlText);

  const buttonEncode = document.querySelector(".eencode-send-button");
  const cancelButtonEncode = document.querySelector(".eencode-cancel-send");

  buttonEncode.addEventListener("click", async () => {
    const ck_editor = document.querySelector(".ck-editor__main");
    const p_editor = ck_editor.firstElementChild;

    const cached = await eencode.GetCache();
    const peer = await LLAPI.getPeer();
    cancelButtonEncode.parentNode.parentNode.classList.remove("hidden");
    await encodeMsgAPI.sendEncodeMessage(p_editor, cached.AESKey, peer);
    cancelButtonEncode.parentNode.parentNode.classList.add("hidden");
  });

  cancelButtonEncode.addEventListener("click", async () => {
    await eencode.AbortCurrentRequest();
    encodeMsgAPI.setSendButton(false);
    cancelButtonEncode.parentNode.parentNode.classList.add("hidden");
  });

}

// 页面加载完成时触发
async function onLoad() {
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

export { onLoad, onConfigView };
