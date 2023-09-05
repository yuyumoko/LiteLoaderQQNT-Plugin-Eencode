const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const crypto = require("crypto");
const algorithm = "aes-256-ctr";

function encrypt(text, key, iv_length) {
  let iv = crypto.randomBytes(iv_length);
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text, key) {
  let textParts = text.split(":");
  let iv = Buffer.from(textParts.shift(), "hex");
  let encryptedText = Buffer.from(textParts.join(":"), "hex");
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


module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile
};
