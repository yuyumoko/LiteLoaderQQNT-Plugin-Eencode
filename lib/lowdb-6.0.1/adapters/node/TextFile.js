"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextFileSync = exports.TextFile = void 0;

var _nodeFs = _interopRequireDefault(require("node:fs"));

var fsPromises = _interopRequireWildcard(require("node:fs/promises"));

var _nodePath = _interopRequireDefault(require("node:path"));

// var _steno = require("@myscope/steno");
var _steno = require("../../../steno-3.0.0/index");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var _TextFile_filename, _TextFile_writer, _TextFileSync_tempFilename, _TextFileSync_filename;

class TextFile {
  constructor(filename) {
    _TextFile_filename.set(this, void 0);

    _TextFile_writer.set(this, void 0);

    __classPrivateFieldSet(this, _TextFile_filename, filename, "f");

    __classPrivateFieldSet(this, _TextFile_writer, new _steno.Writer(filename), "f");
  }

  async read() {
    let data;

    try {
      data = await fsPromises.readFile(__classPrivateFieldGet(this, _TextFile_filename, "f"), 'utf-8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      }

      throw e;
    }

    return data;
  }

  write(str) {
    return __classPrivateFieldGet(this, _TextFile_writer, "f").write(str);
  }

}

exports.TextFile = TextFile;
_TextFile_filename = new WeakMap(), _TextFile_writer = new WeakMap();

class TextFileSync {
  constructor(filename) {
    _TextFileSync_tempFilename.set(this, void 0);

    _TextFileSync_filename.set(this, void 0);

    __classPrivateFieldSet(this, _TextFileSync_filename, filename, "f");

    __classPrivateFieldSet(this, _TextFileSync_tempFilename, _nodePath.default.join(_nodePath.default.dirname(filename), `.${_nodePath.default.basename(filename)}.tmp`), "f");
  }

  read() {
    let data;

    try {
      data = _nodeFs.default.readFileSync(__classPrivateFieldGet(this, _TextFileSync_filename, "f"), 'utf-8');
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null;
      }

      throw e;
    }

    return data;
  }

  write(str) {
    _nodeFs.default.writeFileSync(__classPrivateFieldGet(this, _TextFileSync_tempFilename, "f"), str);

    _nodeFs.default.renameSync(__classPrivateFieldGet(this, _TextFileSync_tempFilename, "f"), __classPrivateFieldGet(this, _TextFileSync_filename, "f"));
  }

}

exports.TextFileSync = TextFileSync;
_TextFileSync_tempFilename = new WeakMap(), _TextFileSync_filename = new WeakMap();