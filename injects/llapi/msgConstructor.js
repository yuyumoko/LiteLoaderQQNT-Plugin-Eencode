import { media } from "./media.js";

class Constructor {
    constructTextElement(ele) {
        return {
            type: "text",
            content: ele.textElement.content,
            raw: ele,
        };
    }
    constructFaceElement(ele) {
        return {
            type: "face",
            faceIndex: ele.faceElement.faceIndex,
            faceType: ele.faceElement.faceType == 1 ? "normal" : ele.faceElement.faceType == 2 ? "normal-extended" : ele.faceElement.faceType == 3 ? "super" : ele.faceElement.faceType,
            faceSuperIndex: ele.faceElement.stickerId && parseInt(ele.faceElement.stickerId),
            raw: ele,
        };
    }
    constructRawElement(ele) {
        return {
            type: "raw",
            raw: ele,
        };
    }
    constructImageElement(ele, msg) {
        return {
            type: "image",
            file: ele.picElement.sourcePath,
            downloadedPromise: media.downloadMedia(msg.msgId, ele.elementId, msg.peerUid, msg.chatType, ele.picElement.thumbPath.get(0), ele.picElement.sourcePath),
            raw: ele,
        };
    }
    constructMessage(msg) {
        const downloadedPromises = [];
        const elements = (msg.elements).map((ele) => {
            if (ele.elementType == 1) return this.constructTextElement(ele);
            else if (ele.elementType == 2) {
                const element = this.constructImageElement(ele, msg);
                downloadedPromises.push(element.downloadedPromise);
                return element;
            } else if (ele.elementType == 6) return this.constructFaceElement(ele);
            else return this.constructRawElement(ele);
        });
        return {
            allDownloadedPromise: Promise.all(downloadedPromises),
            peer: {
                uid: msg.peerUid,
                name: msg.peerName,
                chatType: msg.chatType == 1 ? "friend" : msg.chatType == 2 ? "group" : "others",
            },
            sender: {
                uid: msg.senderUid,
                memberName: msg.sendMemberName || msg.sendNickName,
                nickName: msg.sendNickName,
            },
            elements: elements,
            raw: msg,
        };
    }
    constructUser(user) {
        return {
            uid: user.uid,
            qid: user.qid,
            uin: user.uin,
            avatarUrl: user.avatarUrl,
            nickName: user.nick,
            bio: user.longNick,
            sex: { 1: "male", 2: "female", 255: "unset", 0: "unset" }[user.sex] || "others",
            raw: user,
        };
    }
    constructGroup(group) {
        return {
            uid: group.groupCode,
            avatarUrl: group.avatarUrl,
            name: group.groupName,
            role: { 4: "master", 3: "moderator", 2: "member" }[group.memberRole] || "others",
            maxMembers: group.maxMember,
            members: group.memberCount,
            raw: group,
        };
    }
    constructFace(id, label, path) {
        // 创建 msg-qqface 元素
        const msgQQFace = document.createElement('msg-qqface');
        // 设置 data 属性的值
        const dataValue = {
            type: 'qqFace',
            id: id,
            label: label,
            path: path,
            animationData: {
                packId: '1',
                stickerId: '28',
                stickerType: 1,
                sourceType: 1,
                resultId: '',
                superisedId: '',
                randomType: 1
            }
        };
        msgQQFace.setAttribute('data', JSON.stringify(dataValue));
        return msgQQFace.outerHTML;
    }
    test() {
        console.log("test");
    }
}

export const constructor = new Constructor();
