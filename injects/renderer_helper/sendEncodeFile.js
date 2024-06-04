() => {
  async function initSendEncodeFile(sendFileDialog) {
    function close() {
      sendFileDialog
        .querySelector(".q-dialog-footer .q-button--secondary")
        .click();
    }

    const send_encode_file_btn = `
        <button
          class="q-button vue-component eencode-send-file-button"
          role="button"
          bf-label-inner="true"
          tabindex="0"
          aria-busy="false"
          aria-disabled="false"
        ><span class="q-button__slot-warp">加密发送</span></button>`;

    sendFileDialog
      .querySelector(".q-dialog-footer")
      .insertAdjacentHTML("afterbegin", send_encode_file_btn);

    const files = sendFileDialog.__VUE__[0].root.props.items;
    console.log(files);

    sendFileDialog
      .querySelector(".eencode-send-file-button")
      .addEventListener("click", async () => {
        close();

        const peer = await eencode.getPeer();

        files.forEach(async (file) => {
          const filePath = file.path;
          const encodeFile = await eencode.EncryptFile(filePath);
          const fileInfo = await destructFileElement(encodeFile);
          console.log(`源文件: ${filePath}`);
          console.log(`加密文件: ${encodeFile}`);

          const fileSize = fileInfo.fileElement.fileSize;
          const autoDelFile = (uploadInfo) => {
            console.log(uploadInfo)
            eencode.deleteFileSync(encodeFile).then(() => {
              console.log(`删除加密文件: ${encodeFile}`);
            });
          };
          EnEvent.once("media-progerss-update-" + fileSize, autoDelFile);

          
          await _LLAPI.sendMessage(peer, [
            {
              type: "raw",
              raw: fileInfo,
            },
          ]);

        });
      });
  }

  return {
    initSendEncodeFile,
  };
};
