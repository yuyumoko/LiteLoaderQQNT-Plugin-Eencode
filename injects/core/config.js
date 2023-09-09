const path = require("path");
const DB = require("./db");
const defaultConfig = require("../config/default.json");
const manifestConfig = require("../../manifest.json")

class Config extends DB {
  constructor(config_path, default_data=defaultConfig) {
    super(path.join(config_path, "config.json"), default_data);
  }

  load() {
    let configData = Object.assign({}, defaultConfig, this.read());
    configData["manifest"] = manifestConfig;
    return configData
  }
}

Config.default = defaultConfig;

module.exports = Config;
