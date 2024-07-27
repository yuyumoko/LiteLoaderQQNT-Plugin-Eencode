const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const crypto = require("crypto");
const algorithm = "aes-256-ctr";

function randomString(e) {    
    e = e || 32;
    var t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
    a = t.length,
    n = "";
    for (i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n
}

function encrypt(text, key, iv_length, buffType = "hex", isFile = false) {
  let iv;
  if(isFile) {
    iv = key.substring(0, iv_length);
  }
  else {
    iv = randomString(iv_length);
  }
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  if(isFile) {
    return encrypted.toString(buffType);
  }
  else {
    return iv + "*" + encrypted.toString(buffType);
  }
}

function decrypt(text, key, iv_length, buffType = "hex") {
  console.log(text, key, "decrypt");
  let iv;
  if (text.includes(":")) {
    let textParts = text.split(":");
    iv = Buffer.from(textParts.shift(), buffType);
    text = textParts[0];
  } else {
    if(text.includes("*"))
    {
      let textParts = text.split("*");
      iv = textParts[0];
      text = textParts[1];
      console.log(iv, text)
    }
    else
    {
      iv = key.substring(0, iv_length);
    }
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