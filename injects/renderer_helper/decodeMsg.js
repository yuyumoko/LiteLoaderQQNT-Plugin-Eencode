() => {
  function bytesToSize(bytes) {
    if (bytes === 0) return "0 B";
    var k = 1024,
      sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
  }

  function asyncImgChecked(file) {
    return new Promise(async (resolve, reject) => {
      let video = document.createElement("video");
      const fileData = await eencode.readFileSync(file);
      video.src = URL.createObjectURL(new Blob([fileData]));
      video.currentTime = 1;
      video.oncanplay = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.setAttribute("width", video.videoWidth);
        canvas.setAttribute("height", video.videoHeight);
        video.setAttribute("width", video.videoWidth);
        video.setAttribute("height", video.videoHeight);
        ctx.drawImage(video, 0, 0, video.width, video.height);
        resolve({
          duration: parseInt(video.duration % 60),
          imgSrc: canvas.toDataURL("image/png"),
          width: video.videoWidth,
          height: video.videoHeight,
          size: bytesToSize(fileData.byteLength),
        });
      };
    });
  }

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
      <div
      class="image pic-element vue-component eencode-img"
      data-src="${imgUrl}"
      element-id="0"
      draggable="true"
      data-v-0ba5c60c=""
      data-v-68d8f163=""
      data-v-59241730=""
      role="img"
      tabindex="-1"
      bf-label-inner="true"
      style="width: auto; height: auto"
      aria-label="图片"
    >
      <img
        class="image-content"
        src="${imgUrl}"
        data-role="pic"
        data-path="${imgUrl}"
        data-pic-sub-type="0"
        loading="eager"
        data-v-0ba5c60c=""
      />
    </div>
    `;
    }
    return imgContext;
  }

  async function handleDecodeVideoMessage(videoPath, videoName) {
    const videoInfo = await asyncImgChecked(videoPath);
    const videoContext = `
    <div class="msg-preview msg-preview--video file-element vue-component eencode-video-play" tag="msg-file" expired="false" data-v-fbc9a004=""
    data-v-2d6e7b00="" style="">
    <div class="image no-drag vue-component" data-v-0acd8bde="" data-v-fbc9a004="" role="img" tabindex="-1"
        data-path="${videoPath}"
        style="width: 100%; height: 100%;"><img class="image-content"
            src="${videoInfo.imgSrc}"
            loading="eager" data-v-0acd8bde=""></div>
    <div class="file-info-mask vue-component" data-v-a8c5b5f4="">
        <p class="text-ellipsis" data-v-a8c5b5f4="" style="display: flex;"><span class="text-ellipsis"
                data-v-a8c5b5f4="">
            </span>
            <span data-v-a8c5b5f4="">${videoName}</span>
        </p>
        <p data-v-a8c5b5f4="">${videoInfo.size} ${videoInfo.width}x${videoInfo.height}</p>
    </div>
    <div class="file-status-mask file-status-mask--show vue-component eencode-video-circle-play" data-v-b9e59d32="" data-v-fbc9a004="">
        <div class="circle-progress file-progress vue-component" data-v-2e1f86fb="" data-v-b9e59d32=""
            data-path="${videoPath}"
            style="--size: 56px;">
            <svg class="circle-progress__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-v-2e1f86fb="">
                <circle class="circle-progress__trace" cx="12" cy="12" r="9.5" stroke-opacity="0.5"
                    stroke="var(--text_white)" fill="var(--gray-black)" fill-opacity="0.3" stroke-width="1"
                    data-v-2e1f86fb=""></circle>
                <circle class="circle-progress__progress" cx="12" cy="12" r="9.5" fill="none"
                    transform="rotate(-90, 12, 12)" shape-rendering="geometricPrecision" stroke="var(--text_white)"
                    stroke-width="1" stroke-dasharray="59.690260418206066" stroke-dashoffset="58.49645520984194"
                    data-v-2e1f86fb=""></circle>
            </svg>
            <div class="circle-progress__content" data-v-2e1f86fb=""><i class="q-icon icon vue-component"
                    data-v-00722f01="" data-v-b9e59d32="" style="--56d9c346: inherit; --f44aba40: 56px;"><svg
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M10 14.5052V9.49481C10 9.00923 10 8.76644 10.1012 8.63261C10.1894 8.51601 10.3243 8.44386 10.4702 8.43515C10.6377 8.42515 10.8397 8.55982 11.2438 8.82917L15.0015 11.3344C15.3354 11.5569 15.5023 11.6682 15.5605 11.8085C15.6113 11.9311 15.6113 12.0689 15.5605 12.1915C15.5023 12.3318 15.3354 12.4431 15.0015 12.6656L11.2438 15.1708C10.8397 15.4402 10.6377 15.5749 10.4702 15.5649C10.3243 15.5561 10.1894 15.484 10.1012 15.3674C10 15.2336 10 14.9908 10 14.5052Z"
                            fill="white"></path>
                    </svg></i></div>
        </div>
    </div>
</div>
    `;
    return videoContext;
  }

  async function decryptAES(text, key) {
    let rawText = await eencode.AES_decrypt(text, key);
    if (!rawText.startsWith("pgd:")) {
      return;
    }
    rawText = rawText.slice(4);
    console.log(rawText);
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
            rawText += `${value}`;
            break;
          case "imag":
            rawText += handleDecodeImageMessage(value);
            break;
          case "file":
            let filename = value.split("/").pop();
            if (!filename.endsWith("-mp4")) {
              return;
            } else {
              filename = filename.replace("-mp4", "");
            }

            filename = filename.replace(".png", ".mp4");
            let localPath = cachePath + "\\download\\" + filename;
            let isExist = await eencode.existsSync(localPath);
            if (!isExist) {
              await eencode.DownloadFile(value, filename);
              await eencode.FixVideoFile(localPath);
            }
            rawText += await handleDecodeVideoMessage(localPath, filename);
            break;
        }
      }
    } else {
      // rawText =  (rawText);
      rawText = rawText.replace(/ /g, "&nbsp;");
      rawText = rawText.replace(/\n/g, "<br/>");
    }

    return rawText;
  }

  function addOpenWeb(elements, type = "ondblclick", isDataPath) {
    if (!elements) return;
    for (let i = 0; i < elements.length; i++) {
      const img = elements[i].firstElementChild;
      img[type] = async () => {
        let path = img.src;
        if (isDataPath) {
          path = img.getAttribute("data-path");
        }

        await eencode.OpenWeb(path);
      };
    }
  }

  async function messageHandler(node, noProcessText = false) {
    const cached = await eencode.GetCache();
    if (!cached.autoDecrypt) {
      return;
    }
    const msgContainer = node.querySelector(".msg-content-container");
    if (msgContainer) {
      // 常规信息内容
      const targetElement = msgContainer.firstElementChild;
      const innerHTML = targetElement.innerHTML;
      const innerText = targetElement.innerText.trim();
      if (innerText.startsWith(config.encryptConfig.AES.prefix)) {
        const text = innerText.slice(config.encryptConfig.AES.prefix.length);
        if (!noProcessText) {
          targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
          targetElement.innerHTML += `<p>正在解密...</p>`;
        }

        let result = await decryptAES(text, cached.AESKey);
        if (!result) {
          const peer = await LLAPI.getPeer();
          if (peer.chatType === "group") {
            // 尝试使用群ID解密
            const AESKey = await eencode.AES_customKey(peer.chatType, peer.uid);
            result = await decryptAES(text, AESKey);
          }
        }

        if (!result) {
          targetElement.innerHTML = innerHTML;
          targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
          targetElement.innerHTML += `<p>解密失败</p>`;
          return;
        }

        msgContainer.classList.add("decode-msg-container");

        targetElement.innerHTML = innerHTML;
        targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
        targetElement.innerHTML += `${result}`;

        const message__wrapper = targetElement.parentElement.parentElement;
        if (!message__wrapper.classList.contains("decode-msg")) {
          message__wrapper.classList.add("decode-msg");
        }

        addOpenWeb(targetElement.querySelectorAll(".eencode-img"));

        addOpenWeb(
          targetElement.querySelectorAll(".eencode-video-play"),
          "ondblclick",
          true
        );

        addOpenWeb(
          targetElement.querySelectorAll(".eencode-video-circle-play"),
          "onclick",
          true
        );
      }
    } else {
      // 文件解密支持
      const fileElement = node.querySelector(".file-element");
      if (!fileElement) return;
      if (!fileElement.title.startsWith("pge-")) return;
      const fileInfoDiv = fileElement.querySelector(".file-info");
      fileInfoDiv.style.display = "inline-table";

      const fileInfo = fileElement.__VUE__[0].props.msgElement.fileElement;
      let fileName = fileInfo.fileName;
      fileName = fileName.slice(config.encryptConfig.AES.prefix.length);
      let fileNameExt = "";
      if (fileName.includes(".")) {
        fileNameExt = `.${fileName.split(".").pop()}`;
        fileName = fileName.split(".").slice(0, -1).join(".");
      }
      fileName = await eencode.AES_decrypt(fileName, cached.AESKey);
      fileName += fileNameExt;

      fileInfoDiv.innerHTML += `<hr class="horizontal-dividing-line">`;
      fileInfoDiv.innerHTML += `<p data-v-91f9511c="">文件名: ${fileName}</p>`;
      fileInfoDiv.innerHTML += `<p data-v-91f9511c="">保存文件时, 自动解密</p>`;
      fileInfoDiv.innerHTML += `<p data-v-91f9511c="">右键菜单也可以解密文件</p>`;

      const filePath = fileInfo.filePath;
      const fileSize = fileInfo.fileSize;

      const autoDecryptFile = (fileState) => {
        // console.log(fileState)
        const timer = setInterval(async () => {
          const isExist = await eencode.existsSync(filePath);
          if (isExist) {
            clearInterval(timer);
            await eencode.DecryptFile(filePath);
            await eencode.deleteFileSync(filePath);
            console.log("文件解密完成");
            showMsg("文件解密成功!");
          }
        }, 1000);
      };

      EnEvent.once("media-progerss-update-" + fileSize, autoDecryptFile);
    }
  }
  return {
    handleDecodeImageMessage,
    decryptAES,
    messageHandler,
  };
};
