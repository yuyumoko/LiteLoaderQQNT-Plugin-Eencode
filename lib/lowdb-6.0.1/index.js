"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Memory = require("./adapters/Memory.js");

Object.keys(_Memory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Memory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Memory[key];
    }
  });
});

var _Low = require("./core/Low.js");

Object.keys(_Low).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Low[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Low[key];
    }
  });
});