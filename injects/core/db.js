const fs = require("fs");
const path = require("path");

const { LowSync } = require("../../lib/lowdb-6.0.1/index");
const { JSONFileSync } = require("../../lib/lowdb-6.0.1/node");

class DB {
  constructor(file_path, default_data) {
    if (!fs.existsSync(file_path)) {
      const path_dir = path.dirname(file_path);
      fs.mkdirSync(path_dir, { recursive: true });
    }
    this.db = new LowSync(new JSONFileSync(file_path), default_data);
  }

  save() {
    this.db.write();
  }

  set(key, obj) {
    this.read();
    if (key.includes(".")) {
      const keys = key.split(".");
      let temp = this.db.data;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) {
          temp[keys[i]] = {};
        }
        temp = temp[keys[i]];
      }
      temp[keys[keys.length - 1]] = obj;
    } else {
      this.db.data[key] = obj;
    }
    this.save();
  }

  get(key) {
    this.read();
    return this.db.data[key];
  }

  read() {
    this.db.read();
    return this.db.data;
  }
}

module.exports = DB;
