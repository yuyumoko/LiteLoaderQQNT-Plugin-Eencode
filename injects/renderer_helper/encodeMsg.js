() => {
  async function uploadImage(imgUrls) {
    const uploadUrl = "https://img.chkaja.com/ajaximg.php";

    return eencode.uploadChkajaImage(uploadUrl, imgUrls).then((data) => {
      if (data === "") {
        Swal.fire({
          icon: "error",
          title: "上传失败",
          text: "图片上传失败, 请检查网络",
        });
        return;
      }

      const imgUrls = Array.from(
        new Set(
          data.match(
            /https:\/\/img.chkaja.com\/([0-9a-f])+\.[jpg][pni][e]?[gf]/gm
          )
        )
      );
      console.log(`imgUrls: ${imgUrls}`);
      return imgUrls;
    });
  }

  function setSendButton(isSend, processNum) {
    const buttonEncode = document.querySelector(".eencode-send-button");
    if (isSend) {
      buttonEncode.classList.add("send--disabled");
      buttonEncode.innerText = `正在加密[${processNum}]`;
    } else {
      buttonEncode.classList.remove("send--disabled");
      buttonEncode.innerText = "加密发送";
    }
  }

  async function encodeMessage(element, key, processNum=null) {

    let formatMsg = [];
    const addFormatMsg = (type, value) => formatMsg.push({ type, value });
    const getFormatMsg = (separator = "\n") =>
      formatMsg.map((msg) => msg.value).join(separator);

    addFormatMsg("head", "pgd:");

    let hasImage = false;
    let hasText = false;
    let hasFile = false;
    let count = 0;

    for (let line of element.childNodes) {
      for (let msg of line.childNodes) {
        if (processNum) processNum(count += 1)
        switch (msg.nodeName) {
          case "MSG-IMG":
            try {
              const imgSrc = msg.lastElementChild.src.replace("appimg://", "");
              console.log(imgSrc);
              const uploadResult = await uploadImage([
                decodeURIComponent(imgSrc),
              ]);
              addFormatMsg("imag", uploadResult[0]);
              hasImage = true;
            } catch (error) {
              Swal.fire({
                icon: "error",
                title: "上传失败",
                text: "图片上传失败, 请检查网络",
              });
              new Error(error);
              return;
            }
            break;
          case "#text":
            let msgText = msg.textContent;
            msgText = [].filter
              .call(msgText, (c) => c.charCodeAt() !== 8288)
              .join("");
            if (msgText === "") break;
            addFormatMsg("text", encodeURIComponent(msgText));

            hasText = true;
            break;
          case "MSG-FILE":
            addFormatMsg(
              "file",
              encodeURIComponent(msg.lastElementChild.dataset.url)
            );

            hasFile = true;
            break;
        }
      }
      addFormatMsg("text", encodeURIComponent("\n"));
    }
    formatMsg.pop();

    let rawMsg = formatMsg[0].value;
    formatMsg.shift();

    if (hasImage && !hasText) {
      // 只有图片
      rawMsg += "img-start:\n";
      rawMsg += getFormatMsg();
    } else if (hasText && !hasImage) {
      // 只文本
      rawMsg += getFormatMsg("");
    } else {
      // 复合型
      for (let msg of formatMsg) {
        rawMsg += `${msg.type}:${msg.value}\n`;
      }
    }
    console.log("rawMsg: " + rawMsg)

    const encodeData = await eencode.AES_encrypt(rawMsg, key);

    return `pge:${encodeData}`;
  }

  async function sendEncodeMessage(element, key, peer) {
    if (element.innerText.trim() === "") return;

    try {
      const elements = [
        {
          type: "text",
          content: await encodeMessage(element, key, (count) => setSendButton(true, count)),
        },
      ];
      await LLAPI.sendMessage(peer, elements);
      await LLAPI.set_editor(``);
      setSendButton(false);
    } catch (error) {
      setSendButton(false);
      console.error(error);
    }
  }

  return {
    encodeMessage,
    sendEncodeMessage,
    setSendButton,
    uploadImage,
  };
};
