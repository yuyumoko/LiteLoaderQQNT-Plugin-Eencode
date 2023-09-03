() => {
  function isComplexText(rawText) {
    const tags = ["imag:", "text:", "file:"];
    for (const tag of tags) {
      if (rawText.startsWith(tag)) {
        return true;
      }
    }
    return false;
  }

  function handleDecodeImageMessage(decode_text) {
    decode_text = decode_text.replace(/img-start:\n/g, "");
    decode_text = decode_text.replace(/\nimg-end/g, "");
    const imgUrls = decode_text.split("\n");
    let imgContext = "";
    for (const imgUrl of imgUrls) {
      if (!imgUrl) continue;
        imgContext += `
    <div class="image pic-element vue-component eencode-img" data-src="${imgUrl}" element-id="0" draggable="true"
      aria-label="图像" data-v-0acd8bde="" data-v-562c0411="" data-v-fd13d650="" role="img" tabindex="-1"
      style="width: auto;height: auto;">
      <img class="image-content" src="${imgUrl}" data-role="pic" data-path="${imgUrl}" data-pic-sub-type="1"
          loading="eager" data-v-0acd8bde="">
    </div>`;
    }
    return imgContext;
  }

  async function decryptAES(text, key) {
    let rawText = await eencode.AES_decrypt(text, key);
    if (!rawText.startsWith("pgd:")) {
      return;
    }
    rawText = rawText.slice(4);

    const isImgStart = rawText.indexOf("img-start:\n") === 0;

    if (isImgStart) {
      rawText = handleDecodeImageMessage(rawText);
    } else if (isComplexText(rawText)) {
      const msgList = rawText.split("\n");
      rawText = "";
      for (const msg of msgList) {
        if (!msg) continue;
        let msgSplit = msg.split(":");
        const type = msgSplit[0];
        msgSplit.shift();
        const value = msgSplit.join(":");
        switch (type) {
          case "text":
            rawText += `${decodeURIComponent(value)}`;
            break;
          case "imag":
            rawText += handleDecodeImageMessage(value);
            break;
        }
      }
    } else {
      rawText = decodeURIComponent(rawText);
      rawText = rawText.replace(/ /g, "&nbsp;");
      rawText = rawText.replace(/\n/g, "<br/>");
    }

    return rawText;
  }

  async function messageHandler(node) {
    const cached = await eencode.GetCache();
    if (!cached.autoDecrypt) {
      return;
    }
    const targetElement = node.querySelector(
      ".msg-content-container"
    ).firstElementChild;

    const innerHTML = targetElement.innerHTML;
    const innerText = targetElement.innerText.trim();

    if (innerText.startsWith(config.encryptConfig.AES.prefix)) {
      const text = innerText.slice(config.encryptConfig.AES.prefix.length);

      targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
      targetElement.innerHTML += `<p>正在解密...</p>`;

      const result = await decryptAES(text, cached.AESKey);
      if (!result) {
        targetElement.innerHTML = innerHTML;
        targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
        targetElement.innerHTML += `<p>解密失败</p>`;
        return;
      }

      targetElement.innerHTML = innerHTML;
      targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
      targetElement.innerHTML += `${result}`;

      const message__wrapper = targetElement.parentElement.parentElement;
      if (!message__wrapper.classList.contains("decode-msg")) {
        message__wrapper.classList.add("decode-msg");
      }

      let imgDOM = targetElement.querySelectorAll(".eencode-img");
      if (imgDOM) {
        for (let i = 0; i < imgDOM.length; i++) {
          const img = imgDOM[i].firstElementChild;
          img.ondblclick = async () => {
            await eencode.OpenWeb(img.src);
          };
        }
      }
    }
  }
  return {
    handleDecodeImageMessage,
    decryptAES,
    messageHandler,
  };
};
