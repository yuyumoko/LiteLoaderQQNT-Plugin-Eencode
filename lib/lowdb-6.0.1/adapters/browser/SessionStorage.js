"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SessionStorage = void 0;

var _WebStorage = require("./WebStorage.js");

class SessionStorage extends _WebStorage.WebStorage {
  constructor(key) {
    super(key, sessionStorage);
  }

}

exports.SessionStorage = SessionStorage;