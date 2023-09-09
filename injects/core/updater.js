const fs = require("fs");
const request = require("request");
const path = require("path");
const { promisify } = require("util");

const { getObjectDiff, object2urls } = require("../utils/tools");
const { getFileHash } = require("../utils/hash");

const manifestConfig = require("../../manifest.json");

const excludeDir = [".git", ".github", ".vscode", ".vs"];

function iterDir(dir) {
  let resList = [];
  fs.readdirSync(dir).forEach((file) => {
    if (excludeDir.includes(file)) return;

    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      resList = resList.concat(iterDir(filePath));
    } else {
      resList.push(filePath);
    }
  });
  return resList;
}

async function githubHashData(proxy = true) {
  const repo = manifestConfig.repository.repo;
  const branch = manifestConfig.repository.branch;
  let baseUrl = `https://raw.githubusercontent.com/${repo}/${branch}/hash.json`;
  if (proxy) {
    baseUrl = `https://ghproxy.com/${baseUrl}`;
  }
  const res = await promisify(request)(baseUrl);
  return JSON.parse(res.body);
}

class Updater {
  constructor(dirPath = "") {
    if (!dirPath || !fs.existsSync(dirPath)) {
      throw new Error("dirPath is not exist");
    }

    this.dirPath = path.normalize(dirPath);
  }

  async generateFilesHash() {
    const self = this;
    let hashObj = {};

    for (const filePath of iterDir(self.dirPath)) {
      const fileMd5 = await getFileHash(filePath);
      const pathList = filePath
        .replace(self.dirPath + path.sep, "")
        .split(path.sep);
      const distFile = pathList.pop();
      if (pathList.length === 0) {
        hashObj[distFile] = fileMd5;
      } else {
        let level = hashObj;
        pathList.forEach((item, index) => {
          level[item] = level[item] || {};
          level = level[item];
        });
        level[distFile] = fileMd5;
      }
    }
    return hashObj;
  }

  getLocalHashData() {
    return require(path.join(this.dirPath, "hash.json"));
  }

  async check() {
    return githubHashData().then(async (githubHashData) => {
      if (!this.localHashData) {
        this.localHashData = await this.generateFilesHash();
      }
      const diff = getObjectDiff(githubHashData, this.localHashData);
      this.updateUrlPath = object2urls(diff);
      return this.updateUrlPath;
    });
  }

  async install(proxy = true, processCallback) {
    if (!this.updateUrlPath) {
      throw new Error("no update");
    }
    const repo = manifestConfig.repository.repo;
    const branch = manifestConfig.repository.branch;
    let baseUrl = `https://raw.githubusercontent.com/${repo}/${branch}/`;
    if (proxy) {
      baseUrl = `https://ghproxy.com/${baseUrl}`;
    }

    for (const urlPath of this.updateUrlPath) {
      const updateUrl = baseUrl + urlPath;
      if (processCallback) {
        processCallback(urlPath);
      }
      const updateRes = await promisify(request.get)(updateUrl);
      const updatePath = path.join(this.dirPath, urlPath);
      fs.writeFileSync(updatePath, updateRes.body);
    }
    return true;
  }
}

module.exports = {
  Updater,
};
