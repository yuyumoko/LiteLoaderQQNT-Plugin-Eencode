const fs = require("fs");
const crypto = require("crypto");

async function getFileHash(filePath) {
  const file = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5");
  hash.update(file);
  return hash.digest("hex");
}

module.exports = {
  getFileHash,
};
