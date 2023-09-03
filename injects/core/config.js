const path = require("path");
const DB = require("./db");
const defaultConfig = require("../config/default.json");

class Config extends DB {
  constructor(config_path, default_data=defaultConfig) {
    super(path.join(config_path, "config.json"), default_data);
  }

  load() {
    return Object.assign({}, defaultConfig, this.read());
  }
}

Config.default = defaultConfig;

module.exports = Config;
