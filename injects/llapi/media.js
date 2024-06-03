/*
 * @Date: 2024-01-17 16:34:19
* LastEditors: Night-stars-1 nujj1042633805@gmail.com
* LastEditTime: 2024-02-14 23:21:00
 */
import { ntCall, output } from "./utils.js";

const exists = eencode.existsSync;
// const getSilk = LLAPI_PRE.getSilk;

class Media {
    async prepareImageElement(file) {

        const type = await ntCall("ns-FsApi", "getFileType", [file]);
        const md5 = await ntCall("ns-FsApi", "getFileMd5", [file]);
        const fileName = `${md5}.${type.ext}`;
        const filePath = await ntCall("ns-ntApi", "nodeIKernelMsgService/getRichMediaFilePathForGuild", [
            {
                path_info: {
                    md5HexStr: md5,
                    fileName: fileName,
                    elementType: 2,
                    elementSubType: 0,
                    thumbSize: 0,
                    needCreate: true,
                    downloadType: 1,
                    file_uuid: ""
                }
            }
        ]);
        await ntCall("ns-FsApi", "copyFile", [{ fromPath: file, toPath: filePath }]);
        const imageSize = await ntCall("ns-FsApi", "getImageSizeFromPath", [file]);
        const fileSize = await ntCall("ns-FsApi", "getFileSize", [file]);
        return {
            md5HexStr: md5,
            fileSize: fileSize,
            picWidth: imageSize.width,
            picHeight: imageSize.height,
            fileName: fileName,
            sourcePath: filePath,
            original: true,
            picType: 1001,
            picSubType: 0,
            fileUuid: "",
            fileSubId: "",
            thumbFileSize: 0,
            summary: "",
        };
    }

    async preparePttElement(oldFilePath) {
        const ext = oldFilePath.split(".").pop();
        const silkData = await getSilk(oldFilePath)
        const newFilePath = silkData.path;
        const md5 = await ntCall("ns-FsApi", "getFileMd5", [newFilePath]);
        const fileName = `${md5}.${ext}`;
        const filePath = await ntCall("ns-ntApi", "nodeIKernelMsgService/getRichMediaFilePathForGuild", [
            {
                path_info: {
                    md5HexStr: md5,
                    fileName: fileName,
                    elementType: 2,
                    elementSubType: 0,
                    thumbSize: 0,
                    needCreate: true,
                    downloadType: 1,
                    file_uuid: ""
                }
            }
        ]);
        await ntCall("ns-FsApi", "copyFile", [{ fromPath: newFilePath, toPath: filePath }]);
        const fileSize = await ntCall("ns-FsApi", "getFileSize", [filePath]);
        return {
            fileName: fileName,
            filePath: filePath,
            md5HexStr: md5,
            fileSize: fileSize,
            duration: silkData.duration/1024,
            formatType: 1,
            voiceType: 1,
            voiceChangeType: 0,
            canConvert2Text: true,
            waveAmplitudes: [
                0, 18, 9, 23, 16, 17, 16, 15, 44, 17, 24, 20, 14, 15, 17,
            ],
            fileSubId: "",
            playState: 1,
            autoConvertText: 0,
        };
    }
    
    async downloadMedia(msgId, elementId, peerUid, chatType, filePath, originalFilePath) {
        if (await exists(originalFilePath)) return;
        return await ntCall("ns-ntApi", "nodeIKernelMsgService/downloadRichMedia", [
            {
                getReq: {
                    msgId: msgId,
                    chatType: chatType,
                    peerUid: peerUid,
                    elementId: elementId,
                    thumbSize: 0,
                    downloadType: 1,
                    filePath: filePath,
                },
            },
            undefined,
        ]);
    }
}

export const media = new Media();
