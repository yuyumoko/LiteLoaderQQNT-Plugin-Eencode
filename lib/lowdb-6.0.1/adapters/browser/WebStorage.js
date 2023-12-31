"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebStorage = void 0;

var __classPrivateFieldSet = void 0 && (void 0).__classPrivateFieldSet || function (receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};

var __classPrivateFieldGet = void 0 && (void 0).__classPrivateFieldGet || function (receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};

var _WebStorage_key, _WebStorage_storage;

class WebStorage {
  constructor(key, storage) {
    _WebStorage_key.set(this, void 0);

    _WebStorage_storage.set(this, void 0);

    __classPrivateFieldSet(this, _WebStorage_key, key, "f");

    __classPrivateFieldSet(this, _WebStorage_storage, storage, "f");
  }

  read() {
    const value = __classPrivateFieldGet(this, _WebStorage_storage, "f").getItem(__classPrivateFieldGet(this, _WebStorage_key, "f"));

    if (value === null) {
      return null;
    }

    return JSON.parse(value);
  }

  write(obj) {
    __classPrivateFieldGet(this, _WebStorage_storage, "f").setItem(__classPrivateFieldGet(this, _WebStorage_key, "f"), JSON.stringify(obj));
  }

}

exports.WebStorage = WebStorage;
_WebStorage_key = new WeakMap(), _WebStorage_storage = new WeakMap();