const ipcRenderer = eencode.ipcRenderer_en;
const ipcRenderer_on = eencode.ipcRenderer_en_on;
const set_id = eencode.llapi_set_id;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function customInspect(obj, depth = 0) {
    if (depth > 3) {
      return '...'; // 控制递归深度
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      const elements = obj.map((item) => customInspect(item, depth + 1)).join(', ');
      return `[${elements}]`;
    }
    
    const entries = Object.entries(obj)
      .map(([key, value]) => `${key}: ${customInspect(value, depth + 1)}`)
      .join(', ');
    
    return `{${entries}}`;
}

function printObject(object) {
    return customInspect(object, null);
}

function patchLogger() {
    const log = async (level, ...args) => {
        const serializedArgs = [];
        for (const arg of args) {
            serializedArgs.push(typeof arg == "string" ? arg: await printObject(arg)); // arg?.toString()
        }
        ipcRenderer.send("___!log", level, ...serializedArgs);
    };
    (
        [
            ["debug", 0],
            ["log", 1],
            ["info", 2],
            ["warn", 3],
            ["error", 4],
        ]
    ).forEach(([method, level]) => {
        const originalConsoleMethod = console[method];
        console[method] = (...args) => {
            log(level, ...args)
            originalConsoleMethod.apply(console, args);
        };
    });
}

// patchLogger(); // 重写渲染进程log

let { webContentsId } = ipcRenderer.sendSync("___!boot");
if (!webContentsId) {
    webContentsId = "2"
}

function output(...args) {
    console.log("\x1b[32m[LLAPI-渲染]\x1b[0m", ...args);
}

class NTCallError extends Error {
    code;
    message;
    constructor(code, message) {
        super();
        this.code = code;
        this.message = message;
    }
}

function ntCall(eventName, cmdName, args, isRegister = false) {
    return new Promise(async (resolve, reject) => {
        const uuid = crypto.randomUUID();
        ipcRenderer_on(`LL_DOWN_${uuid}`, (event, data) => {
            resolve(data);
        });
        /**
        ipcRenderer.send(
            `LL_UP_${webContentsId}`,
            {
                type: "request",
                callbackId: uuid,
                eventName: `${eventName}-${webContentsId}${isRegister ? "-register" : ""}`,
            },
            [cmdName, ...args]
        );
         */
        set_id(uuid, webContentsId);
        ipcRenderer.send(
            `IPC_UP_${webContentsId}`,
            {
                type: "request",
                callbackId: uuid,
                eventName: `${eventName}-${webContentsId}${isRegister ? "-register" : ""}`,
            },
            [cmdName, ...args]
        );
    });
}

export {
    delay,
    output,
    ntCall,
}