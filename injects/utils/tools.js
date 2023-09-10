const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

function getObjectDiff(o1, o2) {
  const diffObj = {};

  for (const key in o1) {
    if (o2[key] === undefined) {
      diffObj[key] = o2[key];
      continue;
    }

    if (typeof o1[key] === "object") {
      const res = getObjectDiff(o1[key], o2[key]);
      if (Object.keys(res).length !== 0) {
        diffObj[key] = res;
      }
      continue;
    }

    if (o2[key] !== o1[key]) {
      diffObj[key] = o2[key];
    }
  }

  return diffObj;
}

function object2urls(obj, pathS = "") {
  let urlPath = [];
  for (let key in obj) {
    if (typeof obj[key] === "object") {
      const res = object2urls(obj[key], `${pathS}${key}/`);
      urlPath = urlPath.concat(res);
      continue;
    }
    urlPath.push(pathS + key);
  }
  return urlPath;
}

function bytesToSizeStr(bytes) {
  if (bytes === 0) return "0 B";
  var k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
}

async function calcDirSize(dirPath) {
  let fileSize = 0;
  async function calc(dirPath) {
    try {
      const statObj = await stat(dirPath);
      if (statObj.isDirectory()) {
        const files = await readdir(dirPath);
        let dirs = files.map((item) => {
          return path.join(dirPath, item);
        });
        let index = 0;
        async function next() {
          if (index < dirs.length) {
            let current = dirs[index++];
            await calc(current);
            await next();
          }
        }
        return await next();
      } else {
        fileSize += statObj.size;
      }
    } catch (err) {
      throw new Error(err);
    }
  }
  await calc(dirPath);
  return fileSize;
}

module.exports = {
  getObjectDiff,
  object2urls,
  bytesToSizeStr,
  calcDirSize,
  calcDirSizeStr: (dirPath) =>
    calcDirSize(dirPath).then((size) => bytesToSizeStr(size)),
};
