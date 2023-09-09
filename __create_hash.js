const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const excludeDir = [".git", ".github", ".vscode", ".vs"];

function getFileHash(filePath) {
  const file = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5");
  hash.update(file);
  return hash.digest("hex");
}

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

function generateFilesHash() {
  const dirPath = __dirname;
  let hashObj = {};

  for (const filePath of iterDir(dirPath)) {
    const fileMd5 = getFileHash(filePath);
    const pathList = filePath.replace(dirPath + path.sep, "").split(path.sep);
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

fs.writeFileSync("hash.json", JSON.stringify(generateFilesHash()));
