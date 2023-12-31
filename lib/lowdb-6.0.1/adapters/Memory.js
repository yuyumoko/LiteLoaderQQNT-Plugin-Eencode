"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MemorySync = exports.Memory = void 0;

var __classPrivateFieldGet = void 0 && (void 0).__classPrivateFieldGet || function (receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};

var __classPrivateFieldSet = void 0 && (void 0).__classPrivateFieldSet || function (receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};

var _Memory_data, _MemorySync_data;

class Memory {
  constructor() {
    _Memory_data.set(this, null);
  }

  read() {
    return Promise.resolve(__classPrivateFieldGet(this, _Memory_data, "f"));
  }

  write(obj) {
    __classPrivateFieldSet(this, _Memory_data, obj, "f");

    return Promise.resolve();
  }

}

exports.Memory = Memory;
_Memory_data = new WeakMap();

class MemorySync {
  constructor() {
    _MemorySync_data.set(this, null);
  }

  read() {
    return __classPrivateFieldGet(this, _MemorySync_data, "f") || null;
  }

  write(obj) {
    __classPrivateFieldSet(this, _MemorySync_data, obj, "f");
  }

}

exports.MemorySync = MemorySync;
_MemorySync_data = new WeakMap();