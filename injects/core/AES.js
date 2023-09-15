const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const crypto = require("crypto");
const algorithm = "aes-256-ctr";


function encrypt(text, key, iv_length, buffType = "hex") {
  // let iv = crypto.randomBytes(iv_length);
  let iv = key.substring(0, iv_length);
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString(buffType);
}

function decrypt(text, key, iv_length, buffType = "hex") {
  let iv;
  if (text.includes(":")) {
    let textParts = text.split(":");
    iv = Buffer.from(textParts.shift(), buffType);
    text = textParts[0];
  } else {
    iv = key.substring(0, iv_length);
  }
  let encryptedText = Buffer.from(text, buffType);
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function encryptFile(rawFile, output, key, iv) {
  const readStream = createReadStream(rawFile);
  const writeStream = createWriteStream(output);
  const transformStream = crypto.createCipheriv(algorithm, key, iv);
  return promisify(pipeline)(readStream, transformStream, writeStream)
}

function decryptFile(encryptFile, output, key, iv) {
  const readStream = createReadStream(encryptFile);
  const writeStream = createWriteStream(output);
  const transformStream = crypto.createDecipheriv(algorithm, key, iv);
  return promisify(pipeline)(readStream, transformStream, writeStream);
}

function generateKeyByStr(strKey) {
  const hash = crypto.createHash("md5");
  hash.update(strKey);
  return hash.digest("hex");
}



module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  generateKeyByStr
};
