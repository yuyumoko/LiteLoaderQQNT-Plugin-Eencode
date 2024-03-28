(async () => {
  const config = await eencode.GetConfig();
  const defaultConfig = await eencode.GetDefaultConfig();

  // 初始化选择框按钮显示内容
  const setValueAndAddSelectedClass = async (value) => {
    const pulldown_menu = view.querySelector(".encrypt-mode");
    const find_data = pulldown_menu.querySelector(`[data-value="${value}"]`);
    find_data.setAttribute("is-selected", "");
    pulldown_menu._title.value = find_data.textContent;
  };

  const value = config.groupEncryptMode;
  await setValueAndAddSelectedClass(value);

  const encryptModeSelect = view.querySelector(".encrypt-mode");
  encryptModeSelect.addEventListener("selected", async (event) => {
    const item_value = event.detail.value;
    await eencode.SetConfig("groupEncryptMode", item_value, true);
  });

  //普通加密模式设置
  let encryptConfig = config.encryptConfig;

  const AESKeyInput = view.querySelector("#AES-Key");

  AESKeyInput.value = encryptConfig.AES.key;

  AESKeyInput.addEventListener("input", () => {
    AESKeyInput.value = AESKeyInput.value.replace(/[^\w\.\/]/gi, "");
  });

  // 按钮事件
  const create = view.querySelector("#AES-config .create");
  const reset = view.querySelector("#AES-config .reset");
  const save = view.querySelector("#AES-config .save");

  create.addEventListener("click", async () => {
    AESKeyInput.value = self.crypto.randomUUID().replace(/[^\w\.\/]/gi, "");
    encryptConfig.AES.key = AESKeyInput.value;
  });
  reset.addEventListener("click", async () => {
    AESKeyInput.value = defaultConfig.encryptConfig.AES.key;
    showMsg("已重置秘钥");
    await eencode.SetAESKey(AESKeyInput.value);
  });
  save.addEventListener("click", async () => {
    encryptConfig.AES.key = AESKeyInput.value;
    showMsg("保存成功");
    await eencode.SetAESKey(AESKeyInput.value);
  });

  const initSwitch = (switch_id, checkState, config_name) => {
    const switch_ctl = view.querySelector(switch_id);
    const attributes = switch_ctl.attributes;

    let checked = attributes.getNamedItem("is-active") !== null;
    if (checked && !checkState) {
      attributes.removeNamedItem("is-active");
    }

    switch_ctl.addEventListener("click", async (e) => {
      let checked = attributes.getNamedItem("is-active") !== null;
      if (checked) {
        attributes.removeNamedItem("is-active");
      } else {
        switch_ctl.setAttribute("is-active", "");
      }

      await eencode.SetConfig(config_name, !checked);

      if (config_name === "autoDecrypt") {
        await eencode.SetCache("autoDecrypt", !checked);
      }
    });
  };

  initSwitch("#autoDecode", config.autoDecrypt, "autoDecrypt");
  initSwitch(
    "#showRawMsg",
    config.showConfig.encryptData,
    "showConfig.encryptData"
  );

  initSwitch("#autoDeleteCache", config.autoDeleteCache, "autoDeleteCache");

  view.querySelector(".cache-path").value = cachePath;
  view.querySelector(".cache-size").innerHTML =
    "已缓存: " + (await eencode.GetCacheSize());
  view.querySelector(".open-cache").addEventListener("click", async () => {
    await eencode.OpenCacheDir();
  });

  const currentVersion = view.querySelector("#eencode-current-version");
  currentVersion.setAttribute(
    "data-title",
    `当前版本版本 ${config.manifest.version}`
  );

  const checkUpdateBtn = view.querySelector("#eencode-checkUpdate");
  const hasFindVersionText = view.querySelector(".has-find");
  const updateLengthText = view.querySelector(".update-length");
  const checkDateText = view.querySelector(".update-check-date");

  const installUpdateBtn = view.querySelector(".eencode-install-update");

  view.querySelector(".eencode-restart").addEventListener("click", async () => {
    await eencode.restart();
  });

  installUpdateBtn.addEventListener("click", async () => {
    try {
      installUpdateBtn.innerHTML = `正在更新..`;
      installUpdateBtn.setAttribute("aria-disabled", "true");
      await eencode.installUpdate();
      installUpdateBtn.setAttribute("hidden", "")
      view.querySelector(".restart-div").attributes.removeNamedItem("hidden");
    } catch (error) {
      showMsg(error.message);
    }
  });

  function setFindVersion(find, updateLength) {
    if (find) {
      hasFindVersionText.innerHTML = `<h2 style="color: coral;">发现新的版本, 请更新!</h2>`;
      updateLengthText.innerHTML = `有${updateLength}个文件需要更新`;
      installUpdateBtn.attributes.removeNamedItem("hidden");
    } else {
      hasFindVersionText.innerHTML = `<h2>已经是最新版本, 无需更新</h2>`;
    }
    checkDateText.innerHTML = `检查时间: ${new Date().toLocaleString()}`;
  }

  async function checkUpdate() {
    checkUpdateBtn.innerHTML = "正在检查更新..";
    checkUpdateBtn.classList.add("is-disabled");
    try {
      const updateDiff = await eencode.checkUpdate();
      console.log(updateDiff);
      const updateLength = Object.keys(updateDiff).length;
      const isFind = updateLength !== 0;
      setFindVersion(isFind, updateLength);

      checkUpdateBtn.innerHTML = "重新检查更新";
      checkUpdateBtn.classList.remove("is-disabled");
    } catch (error) {
      console.log(error);
      checkUpdateBtn.innerHTML = "获取失败, 请重新获取";
      checkUpdateBtn.classList.remove("is-disabled");
    }
  }

  checkUpdateBtn.addEventListener("click", async () => {
    await checkUpdate();
  });

  await checkUpdate();
})();
