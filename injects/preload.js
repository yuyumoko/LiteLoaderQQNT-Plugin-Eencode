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

/**
 * 调用一个qq底层函数，并返回函数返回值。
 * 
 * @param { String } eventName 函数事件名。
 * @param { String } cmdName 函数名。
 * @param { Boolean } registered 函数是否为一个注册事件函数。
 * @param  { ...any } args 函数参数。
 * @returns { Promise<any> } 函数返回值。
 */
function invokeNative(eventName, cmdName, registered, ...args) {
    return new Promise(resolve => {
        const callbackId = crypto.randomUUID();
        const callback = (event, ...args) => {
            if (args?.[0]?.callbackId == callbackId) {
                ipcRenderer.off(`IPC_DOWN_${ webContentsId }`, callback);
                resolve(args[1]);
            }
        };
        ipcRenderer.on(`IPC_DOWN_${ webContentsId }`, callback);
        ipcRenderer.send(`IPC_UP_${ webContentsId }`, {
            type: 'request',
            callbackId,
            eventName: `${ eventName }-${ webContentsId }${ registered ? '-register' : '' }`
        }, [ cmdName, ...args ]);
    });
} 

/**
 * 为qq底层事件 `cmdName` 添加 `handler` 处理器。
 * 
 * @param { String } cmdName 事件名称。
 * @param { Function } handler 事件处理器。
 * @returns { Function } 新的处理器。
 */
function subscribeEvent(cmdName, handler) {
    const listener = (event, ...args) => {
        if (args?.[1]?.[0]?.cmdName == cmdName) {
            handler(args[1][0].payload);
        }
    };
    ipcRenderer.on(`IPC_DOWN_${ webContentsId }`, listener);
    return listener;
}

/**
 * 移除qq底层事件的 `handler` 处理器。
 * 
 * 请注意，`handler` 并不是传入 `subscribeEvent` 的处理器，而是其返回的新处理器。
 * 
 * @param { Function } handler 事件处理器。
 */
function unsubscribeEvent(handler) {
    ipcRenderer.off(`IPC_DOWN_${ webContentsId }`, handler);
}

contextBridge.exposeInMainWorld('euphonyNative', {
    invokeNative,
    subscribeEvent,
    unsubscribeEvent,
    /**
     * 获取 `uin` 代表的 **uid**。
     * 
     * @param { String } uin **qq号**。
     * @returns { String } `uin` 代表的 **uid**。
     */
    convertUinToUid: uin => convertor.get(uin),
    /**
     * 获取 `uid` 代表的 **qq号**。
     * 
     * @param { String } uid **uid**。
     * @returns { String } `uid` 代表的 **qq号**。
     */
    convertUidToUin: uid => convertor.get(uid)
});

contextBridge.exposeInMainWorld('euphonyInternal', {
    getClientKey: () => ipcRenderer.invoke(
        'LiteLoader.eencode.euphony.getClientKey'
    ),
    getPskey: (uin, clientKey, keyIndex, domain) => ipcRenderer.invoke(
        'LiteLoader.eencode.euphony.getPskey',
        uin,
        clientKey,
        keyIndex,
        domain
    ),
    drawLuckyCard: (uin, friendUin, pskey) => ipcRenderer.invoke(
        'LiteLoader.eencode.euphony.drawLuckyCard',
        uin,
        friendUin,
        pskey
    )
});

subscribeEvent('onBuddyListChange', payload => {
    for (const category of payload.data) {
        for (const buddy of category.buddyList) {
            convertor.set(buddy.uin, buddy.uid);
            convertor.set(buddy.uid, buddy.uin);
        }
    }
});

subscribeEvent('nodeIKernelGroupListener/onMemberInfoChange', payload => {
    for (const [uid, nativeMember] of payload.members) {
        convertor.set(nativeMember.uin, uid);
        convertor.set(uid, nativeMember.uin);
    }
});

const memberLoader = subscribeEvent('onGroupListUpdate', payload => {
    if (payload.updateType == 1) {
        for (const nativeGroup of payload.groupList) {
            invokeNative('ns-ntApi', 'nodeIKernelGroupService/createMemberListScene', false, {
                groupCode: nativeGroup.groupCode,
                scene: 'groupMemberList_MainWindow'
            }).then(sceneId => {
                invokeNative('ns-ntApi', 'nodeIKernelGroupService/getNextMemberList', false, {
                    sceneId,
                    num: nativeGroup.memberCount
                });
            });
        }
        unsubscribeEvent(memberLoader);
    }
});

invokeNative('ns-ntApi', 'nodeIKernelGroupListener/onMemberInfoChange', true);
invokeNative('ns-ntApi', 'nodeIKernelBuddyService/getBuddyList', false, { force_update: true });
invokeNative('ns-ntApi', 'nodeIKernelGroupService/getGroupList', false, { forceFetch: true });