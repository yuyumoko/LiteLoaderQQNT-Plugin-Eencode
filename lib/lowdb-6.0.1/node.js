"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _JSONFile = require("./adapters/node/JSONFile.js");

Object.keys(_JSONFile).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _JSONFile[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _JSONFile[key];
    }
  });
});

var _TextFile = require("./adapters/node/TextFile.js");

Object.keys(_TextFile).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _TextFile[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TextFile[key];
    }
  });
});