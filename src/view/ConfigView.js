(async () => {
  const config = await eencode.GetConfig();
  const defaultConfig = await eencode.GetDefaultConfig();

  const configView = view.querySelector(".eencode-config");

  // 消息加密模式
  const list_ctl = configView.querySelector(".ops-selects");

  const pulldown_menu_button = list_ctl.querySelector(
    ".q-pulldown-menu-button"
  );

  pulldown_menu_button.addEventListener("click", (event) => {
    const context_menu = event.currentTarget.nextElementSibling;
    context_menu.classList.toggle("hidden");
  });

  addEventListener("pointerup", (event) => {
    if (event.target.closest(".q-pulldown-menu-button")) {
      return;
    }
    if (!event.target.closest(".q-context-menu")) {
      const context_menu = list_ctl.querySelector(".q-context-menu");
      context_menu.classList.add("hidden");
    }
  });

  // 选择框
  const pulldown_menu = list_ctl.querySelector(".q-pulldown-menu");
  const content = pulldown_menu.querySelector(
    ".q-pulldown-menu-button .content"
  );
  const pulldown_menu_list = pulldown_menu.querySelector(
    ".q-pulldown-menu-list"
  );
  const pulldown_menu_list_items = pulldown_menu_list.querySelectorAll(
    ".q-pulldown-menu-list-item"
  );

  // 初始化选择框按钮显示内容
  const setValueAndAddSelectedClass = async (value) => {
    const name = pulldown_menu.querySelector(
      `[data-value="${value}"] .content`
    );
    name.parentNode.classList.add("selected");
    content.value = name.textContent;
  };

  const value = config.groupEncryptMode;
  await setValueAndAddSelectedClass(value);

  // 选择框条目点击
  pulldown_menu_list.addEventListener("click", async (event) => {
    const target = event.target.closest(".q-pulldown-menu-list-item");
    if (target && !target.classList.contains("selected")) {
      //下拉框菜单点击后，先隐藏下拉框本身
      const all_context_menu = list_ctl.querySelectorAll(".q-context-menu");
      for (const context_menu of all_context_menu) {
        context_menu.classList.add("hidden");
      }

      // 移除所有条目的选择状态
      for (const pulldown_menu_list_item of pulldown_menu_list_items) {
        pulldown_menu_list_item.classList.remove("selected");
      }

      // 添加选择状态
      target.classList.add("selected");

      // 获取选中的选项文本
      const text_content = target.querySelector(".content").textContent;
      content.value = text_content;

      const item_value = target.dataset.value;

      await eencode.SetConfig("groupEncryptMode", item_value);
    }
  });

  function showMsg(msg, type = "success") {
    Swal.fire({
      icon: type,
      title: msg,
      showConfirmButton: false,
      timer: 1500,
    });
  }

  //普通加密模式设置
  let encryptConfig = config.encryptConfig;

  const AESKeyInput = view.querySelector("#AES-Key");

  AESKeyInput.value = encryptConfig.AES.key;

  AESKeyInput.addEventListener("input", () => {
    AESKeyInput.value = AESKeyInput.value.replace(/[^\w\.\/]/gi, "");
  });

  // 按钮事件
  const create = view.querySelector("#AES-config .ops-btns .create");
  const reset = view.querySelector("#AES-config .ops-btns .reset");
  const save = view.querySelector("#AES-config .ops-btns .save");

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
    let checked = switch_ctl.classList.contains("is-active");
    if (checked && !checkState) {
      switch_ctl.classList.toggle("is-active");
    }
    switch_ctl.addEventListener("click", async () => {
      switch_ctl.classList.toggle("is-active");
      checked = switch_ctl.classList.contains("is-active");
      await eencode.SetConfig(config_name, checked);

      if (config_name === "autoDecrypt") {
        await eencode.SetCache("autoDecrypt", checked);
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
  
  const currentVersion = view.querySelector("#eencode-current-version")
  currentVersion.innerHTML = `${config.manifest.version}`

  const checkUpdateBtn = view.querySelector("#eencode-checkUpdate")
  const hasFindVersionText = view.querySelector(".has-find")
  const updateLengthText = view.querySelector(".update-length")
  const checkDateText = view.querySelector(".update-check-date")

  const installUpdateBtn = view.querySelector(".eencode-install-update")


  view.querySelector(".eencode-restart").addEventListener("click", async () => {
    await eencode.restart();
  });


  installUpdateBtn.addEventListener("click", async () => {
    try {
      installUpdateBtn.innerHTML = `正在获取..`;
      installUpdateBtn.setAttribute("aria-disabled", "true");
      await eencode.installUpdate();
      installUpdateBtn.classList.add("hidden");
      view.querySelector(".restart-wrap").classList.remove("hidden");
    } catch (error) {
      showMsg(error.message);
    }
  });


  function setFindVersion(find, updateLength) {
    if (find) {
      hasFindVersionText.innerHTML = `<h2 style="color: coral;">发现新的版本, 请更新!</h2>`;
      updateLengthText.innerHTML = `有${updateLength}个文件需要更新`;
      installUpdateBtn.classList.remove("hidden")
    } else {
      hasFindVersionText.innerHTML = `<h2>已经是最新版本, 无需更新</h2>`;
      installUpdateBtn.classList.add("hidden")
    }
    checkDateText.innerHTML = `检查时间: ${new Date().toLocaleString()}`;
  }

  async function checkUpdate() {
    checkUpdateBtn.innerHTML = "正在检查更新..";
    checkUpdateBtn.setAttribute("aria-disabled", "true");
    try {
      const updateDiff = await eencode.checkUpdate();
      console.log(updateDiff);
      const updateLength = Object.keys(updateDiff).length;
      const isFind = updateLength !== 0;
      setFindVersion(isFind, updateLength);

      checkUpdateBtn.innerHTML = "重新检查更新";
      checkUpdateBtn.setAttribute("aria-disabled", "false");
    } catch (error) {
      checkUpdateBtn.innerHTML = "获取失败, 请重新获取";
      checkUpdateBtn.setAttribute("aria-disabled", "false");
    }
  }
  


  checkUpdateBtn.addEventListener("click", async () => {
    await checkUpdate();
  });

  await checkUpdate();
})();
