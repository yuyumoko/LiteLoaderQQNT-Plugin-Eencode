// const inspector = require("inspector")
const { promisify } = require("util");
const { ipcMain } = require("electron");

class IpcHandle {
  event_prefix = `LiteLoader`;

  constructor(namespace) {
    this.namespace = `${this.event_prefix}.${namespace}`;
  }

  get_fn_key(func_name) {
    return `${this.namespace}.${func_name}`;
  }

  fn(func_name, func) {
    ipcMain.handle(this.get_fn_key(func_name), func);
  }

  fn_async(func_name, func) {
    this.fn(func_name, promisify(func));
  }

  on(func_name, func) {
    ipcMain.on(this.get_fn_key(func_name), func);
  }

  on_async(func_name, func) {
    this.on(func_name, promisify(func));
  }
}

module.exports = IpcHandle;
