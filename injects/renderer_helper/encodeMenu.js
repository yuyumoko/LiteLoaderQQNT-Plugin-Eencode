() => {
  const menuHtml = `
<div class="q-context-menu-item__icon q-context-menu-item__head"><i class="q-icon vue-component" data-v-717ec976=""
        style="--b4589f60: inherit; --6ef2e80d: 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="feather feather-codepen">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
            <line x1="12" y1="22" x2="12" y2="15.5"></line>
            <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
            <polyline points="2 15.5 12 8.5 22 15.5"></polyline>
            <line x1="12" y1="2" x2="12" y2="8.5"></line>
        </svg>
    </i>
</div>
<!----><span class="q-context-menu-item__text">加密选中</span><!---->
`;
  
const decryptFileHtml = `
<div class="q-context-menu-item__icon q-context-menu-item__head"><i class="q-icon vue-component" data-v-717ec976=""
        style="--b4589f60: inherit; --6ef2e80d: 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="feather feather-codepen">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
            <line x1="12" y1="22" x2="12" y2="15.5"></line>
            <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
            <polyline points="2 15.5 12 8.5 22 15.5"></polyline>
            <line x1="12" y1="2" x2="12" y2="8.5"></line>
        </svg>
    </i>
</div>
<!----><span class="q-context-menu-item__text">解密文件</span><!---->
`;
  return (event, isImageViewer = false) => {
    var hasFound = false;
    var timer = setInterval(async () => {
      if (hasFound) return;

      const qContextMenu = document.getElementById("qContextMenu");
      if (qContextMenu != null) {
        hasFound = true;
        clearInterval(timer);
      }

      if (qContextMenu == null) {
        clearInterval(timer);
        return;
      }

      if (qContextMenu.querySelector(".encode-select-msg") != null) {
        return;
      }

      const separator = document.createElement("div");
      separator.classList.add("q-context-menu-separator");
      separator.setAttribute("role", "separator");
      qContextMenu.appendChild(separator);

      if (!qContextMenu.innerText.includes("复制")) {
        return;
      }

      function createMenu(html) {
        const qMenu = document.createElement("a");
        qMenu.classList.add(
          "q-context-menu-item",
          "q-context-menu-item--normal",
          "encode-select-msg"
        );
        qMenu.setAttribute("aria-disabled", "false");
        qMenu.setAttribute("role", "menuitem");
        qMenu.setAttribute("tabindex", "-1");
        qMenu.innerHTML = html;
        return qMenu;
      }

      const qMenu = createMenu(menuHtml);
      qContextMenu.appendChild(qMenu);

      // const decryptFileMenu = createMenu(decryptFileHtml);
      // qContextMenu.appendChild(decryptFileMenu);

      const rect = qContextMenu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        qContextMenu.style.top = `${window.innerHeight - rect.height}px`;
      }

      function findParent(node, className) {
        for (var i = 0, n = node; (n = n.parentNode); i++) {
          if (n.classList.contains(className)) {
            return n;
          }
        }
      }

      function copyTextToClipboard(text) {
        if (!text) return;
        if (navigator.clipboard) {
          return navigator.clipboard.writeText(text);
        }
      }

      function genImageElement(src) {
        let msgImgDiv = document.createElement("MSG-IMG");
        let msgImg = document.createElement("img");
        msgImg.src = src;
        msgImgDiv.appendChild(msgImg);
        return msgImgDiv;
      }

      // 添加点击事件
      qMenu.addEventListener("click", async () => {
        // 先关闭右键菜单
        qContextMenu.remove();

        const cached = await eencode.GetCache();
        let genMsgChildNodes = document.createElement("div");

        if (isImageViewer) {
          genMsgChildNodes.appendChild(genImageElement(event.target.src));
        } else {
          const messageContent = findParent(event.target, "message-content");
          for (let msg of messageContent.childNodes) {
            const nodeName = msg.nodeName;
            if (nodeName === "#text") {
              let msgText = msg.textContent;
              msgText = [].filter
                .call(msgText, (c) => c.charCodeAt() !== 8288)
                .join("");
              if (msgText === "") continue;
            }

            if (msg.classList.contains("text-element")) {
              genMsgChildNodes.appendChild(
                document.createTextNode(msg.textContent)
              );
            } else if (msg.classList.contains("pic-element")) {
              genMsgChildNodes.appendChild(
                genImageElement(msg.querySelector("img").src)
              );
            }
          }
        }

        let divLine = document.createElement("div");
        divLine.appendChild(genMsgChildNodes);

        const { value: text } = await Swal.fire({
          title: "神秘代码",
          input: "textarea",
          html: "<h2>正在加密...</h2>",
          inputValue: (async () => {
            const encodeData = await encodeMsgAPI.encodeMessage(
              divLine,
              cached.AESKey
            );
            Swal.getHtmlContainer().innerHTML = "";
            return encodeData;
          })(),
          confirmButtonText: "复制",
          showCancelButton: true,
        });

        if (text) {
          copyTextToClipboard(text);
        }
      });

      // 解密文件事件
      // decryptFileMenu.addEventListener("click", async () => {
      //   qContextMenu.remove();
      //   const fileElement = findParent(event.target, "file-element");
      //   if (fileElement) {
      //     const fileInfo = fileElement.__VUE__[0].props.msgElement.fileElement;
      //     const filePath = fileInfo.filePath;
      //     const isExist = await eencode.existsSync(filePath);
      //     // console.log(fileInfo);
      //     if (!isExist) {
      //       showMsg("找不到加密文件, 请重新下载", "error");
      //       return;
      //     }
      //     await eencode.DecryptFile(filePath);
      //     await eencode.deleteFileSync(filePath);
      //     showMsg("文件解密成功!");
      //   }
      // });


    }, 50);
  };
};
