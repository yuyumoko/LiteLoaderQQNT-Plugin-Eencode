"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalStorage = void 0;

var _WebStorage = require("./WebStorage.js");

class LocalStorage extends _WebStorage.WebStorage {
  constructor(key) {
    super(key, localStorage);
  }

}

exports.LocalStorage = LocalStorage;