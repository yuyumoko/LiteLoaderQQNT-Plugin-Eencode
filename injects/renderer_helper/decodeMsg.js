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

  function handleDecodeImageMessage(imgUrls) {
    let imgContext = "";
    for (const imgUrl of imgUrls) {
      if (!imgUrl) continue;
      imgContext += `
      <div
      class="image pic-element vue-component eencode-img"
      data-src="${imgUrl}"
      element-id="0"
      draggable="true"
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
        style="width: 100%; height: 100%; object-fit: contain"
      />
    </div>
    `;
    }
    return imgContext;
  }

  async function handleDecodeVideoMessage(videoPath, videoName) {
    const videoInfo = await asyncImgChecked(videoPath);
    const videoContext = `
    <div class="msg-preview msg-preview--video file-element vue-component eencode-video-play" tag="msg-file" expired="false">
    <div class="image no-drag vue-component" role="img" tabindex="-1"
        data-path="${videoPath}"
        style="width: 100%; height: 100%;"><img class="image-content" style="width: 100%; height: 100%; object-fit: contain"
            src="${videoInfo.imgSrc}"
            loading="eager></div>
    <div class="file-info-mask vue-component">
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
    // console.log(rawText);
    const isImgStart = rawText.indexOf("img-start:\n") === 0;

    if (isImgStart) {
      let decode_text = rawText.replace(/img-start:\n/g, "");
      decode_text = decode_text.replace(/\nimg-end/g, "");
      const imgUrls = decode_text.split("\n");
      rawText = handleDecodeImageMessage(imgUrls);
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
            let decode_text = value.replace(/img-start:\n/g, "");
            decode_text = decode_text.replace(/\nimg-end/g, "");
            const imgUrls = decode_text.split("\n");
            rawText += handleDecodeImageMessage(imgUrls);
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
          const peer = await eencode.getPeer();
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
        msgContainer.classList.add("decode-msg");
        targetElement.innerHTML = innerHTML;
        targetElement.innerHTML += `<hr class="horizontal-dividing-line">`;
        targetElement.innerHTML += `${result}`;


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
      fileElement.parentElement.classList.add("decode-msg");
      
      const ctx = fileElement.__VUE__[0].ctx

      fileElement.style.width = "100%";
      const fileInfoDiv = fileElement.querySelector(".file-info");
      fileInfoDiv.style.display = "inline-table";
      fileInfoDiv.style.width = "100%";

      const fileInfo = fileElement.__VUE__[0].props.msgElement.fileElement;
      let fileName = fileInfo.fileName;
      fileName = fileName.slice(config.encryptConfig.AES.prefix.length);
      let fileNameExt = ctx.fileType.suffix

      fileNameExt = fileNameExt.toLowerCase();
      fileName = await eencode.AES_decrypt(fileName, cached.AESKey);
      fileName += `.${fileNameExt}`;

      fileInfoDiv.innerHTML += `<hr class="horizontal-dividing-line">`;
      fileInfoDiv.innerHTML += `<p style="color: aquamarine;text-align: center;">发现加密文件, 保存文件时自动解密</p>`;
      fileInfoDiv.innerHTML += `<p style="color: cornsilk;text-align: center;">文件名: ${fileName}</p>`;

      // 自动解密并预览
      const fileSize = ctx.elementData.fileSize;
      const fileSizeMB = fileSize / 1024 / 1024;

      const expireInfo = ctx.expireInfo.trim();
      const allowImage = ["jpg", "jpeg", "png", "gif"].includes(fileNameExt);
      const allowVideo = ["mp4", "mov", "mkv", "avi"].includes(fileNameExt);
      const allowExt = allowImage || allowVideo;
      const decodeFileFlag =  expireInfo !== "已过期" && allowExt;

      const isLimitSize = false;

      if (allowImage && fileSizeMB > cached.autoDecryptImageLimit) {
        isLimitSize = true;
      }

      if (allowVideo && fileSizeMB > cached.autoDecryptVideoLimit) {
        isLimitSize = true;
      }

      if (decodeFileFlag && !isLimitSize) {
        fileInfoDiv.innerHTML += `<hr class="horizontal-dividing-line">`;
        const decodeFileMsg = document.createElement("p");
        decodeFileMsg.style.color = "darksalmon";
        decodeFileMsg.style.textAlign = "center";
        decodeFileMsg.classList.add("decode-file-msg-text");
        decodeFileMsg.innerText = "正在下载资源...";
        fileInfoDiv.appendChild(decodeFileMsg);

        const downloadPath = ctx.elementData.filePath;
        const cacheFilePath = cachePath + "\\decrypt\\" + fileName;

        const downloadPathExists = await eencode.existsSync(downloadPath);
        const cacheFileExists = await eencode.existsSync(cacheFilePath);

        if (!cacheFileExists) {
          if (!downloadPathExists) {
            downloadPath = await ctx.downloadFile();
          }

          decodeFileMsg.innerText = "正在解密...";
          const decryptFilePath = await eencode.DecryptFile(downloadPath);
          await eencode.renameSync(decryptFilePath, cacheFilePath);
        }

        decodeFileMsg.innerText = "解密成功, 右键打开文件夹可查看文件";
        decodeFileMsg.style.color = "greenyellow";

        // ctx.elementData.fileName = fileName;
        ctx.elementData.filePath = cacheFilePath;

        if (allowImage) {
          fileInfoDiv.innerHTML += handleDecodeImageMessage([`local:///${cacheFilePath}`])
        }

        if (allowVideo) {
          fileInfoDiv.innerHTML += await handleDecodeVideoMessage(cacheFilePath, fileName);
        }

        if (downloadPathExists) {
          await eencode.deleteFileSync(downloadPath)
        }

      } else {

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
  }
  return {
    handleDecodeImageMessage,
    decryptAES,
    messageHandler,
  };
};
