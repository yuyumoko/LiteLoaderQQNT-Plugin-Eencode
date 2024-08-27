() => {
  const encodeProcessHtml = `
<div class="av-call-status horseman vue-component" data-v-9e47eb6c="" data-v-5e6159b0="" style="background: aliceblue;padding: 5px;">
  <div class="av-call-info" data-v-9e47eb6c="">
    <div class="content-text" data-v-9e47eb6c="" style="padding-right: 10px;float: left;">加密进度</div>
    <div class="g-container">
      <span class="g-text"></span>
      <div class="g-progress"></div>
    </div>
  </div>
  <div class="av-call-btns BUTTONS_ORDER" data-v-9e47eb6c="">
    <button class="q-button q-button--secondary q-button--small vue-component cancel-send" aria-disabled="false" aria-busy="false"
      data-v-9e47eb6c="">
      <span class="q-button__slot-warp ">取消加密</span>
    </button>
  </div>
</div>`;

  function initProcess() {
    const chatTop = document.querySelector(".chat-msg-area__tip--top");
    if (chatTop) {
      let processBar = chatTop.querySelector(".eencode-process");
      if (!processBar) {
        processBar = document.createElement("div");
        processBar.classList.add("vue-component", "eencode-process");
        processBar.innerHTML = encodeProcessHtml;
        processBar
          .querySelector(".cancel-send")
          .addEventListener("click", async () => {
            await eencode.AbortCurrentRequest();
            setSendButton(false);
            processBar.remove();
          });
        chatTop.appendChild(processBar);
      }
      return processBar;
    }
  }

  function setProcess(current, total) {
    const processBar = initProcess();
    if (processBar) {
      processBar.querySelector(".g-text").innerText = `${current}/${total}`;
      processBar.querySelector(".g-progress").style.width = `${
        (current / total) * 100
      }%`;
    }
  }

  function removeProcess() {
    const processBar = initProcess();
    if (processBar) {
      processBar.remove();
    }
  }

  async function uploadImage(imgUrls, isFile) {
    const uploadUrl = "https://img.chkaja.com/ajaximg.php";

    return eencode
      .uploadChkajaImage(uploadUrl, imgUrls, isFile)
      .then((data) => {
        if (data === "") {
          // Swal.fire({
          //   icon: "error",
          //   title: "上传失败",
          //   text: "图片上传失败, 请检查网络",
          // });
          showMsg("图片上传失败, 请检查网络");
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

  function setSendButton(isSend, current, total) {
    const buttonEncode = document.querySelector(".eencode-send-button");
    if (isSend) {
      buttonEncode.classList.add("send--disabled");
      buttonEncode.innerText = `正在加密`;
      console.log(`current: ${current}, total: ${total}`);
      setProcess(current, total);
    } else {
      buttonEncode.classList.remove("send--disabled");
      buttonEncode.innerText = "加密发送";
      setEditor(""); // Linux下 点击加密发送后 输入框无法正常恢复 需要执行
      removeProcess();
    }
  }

  function findFileMsgElement(elementId) {
    const fileElement = document.querySelectorAll(".file-element");
    if (fileElement) {
      for (const element of fileElement) {
        if (element.getAttribute("element-id") === elementId) {
          return element;
        }
      }
    }
  }

  async function encodeMessage(element, key, process, peer) {
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
      const lineLen = line.childNodes.length - 1;
      for (let msg of line.childNodes) {
        if (process) process((count += 1), lineLen === 0 ? 1 : lineLen);
        switch (msg.nodeName) {
          case "MSG-IMG":
            try {
              const imgSrc = msg.lastElementChild.src.replace("appimg://", "");
              console.log(imgSrc);
              const uploadResult = await uploadImage([
                decodeURIComponent(imgSrc),
              ]);
              
              let imageUrl = uploadResult[0];
              imageUrl = `https://images.weserv.nl/?url=${imageUrl}`

              addFormatMsg("imag", imageUrl);
              hasImage = true;
            } catch (error) {
              if (error.message.includes("reply was never sent")) {
                console.log("用户取消");
                return;
              }
              // Swal.fire({
              //   icon: "error",
              //   title: "上传失败",
              //   text: "图片上传失败, 请检查网络",
              // });
              alert("图片上传失败, 请检查网络");
              console.log(error.message);
            }
            break;
          case "#text":
            let msgText = msg.textContent;
            msgText = [].filter
              .call(msgText, (c) => c.charCodeAt() !== 8288)
              .join("");
            if (msgText === "") break;
            addFormatMsg("text", msgText);

            hasText = true;
            break;
          case "MSG-FILE":
            // 不支持
            break;
        }
      }
      addFormatMsg("text", "\n");
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
    console.log("rawMsg: " + rawMsg);

    if (hasFile) {
      console.log("只允许文件上传");
      setEditor("");
      return;
    }

    const encodeData = await eencode.AES_encrypt(rawMsg, key);

    return `pge:${encodeData}`;
  }

  async function sendEncodeMessage(element, key, peer) {
    if (element.innerText.trim() === "") return;

    try {
      const encodeData = await encodeMessage(
        element,
        key,
        (current, total) => setSendButton(true, current, total),
        peer
      );
      if (!encodeData) {
        setSendButton(false);
        return;
      }

      const elements = [
        {
          type: "text",
          content: encodeData,
        },
      ];
      setSendButton(false);

      setEditor("");
      await sendTextMessage(encodeData);
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
