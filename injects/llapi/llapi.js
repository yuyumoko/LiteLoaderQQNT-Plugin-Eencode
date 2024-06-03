/*
 * @Date: 2024-01-17 16:57:23
* LastEditors: Night-stars-1 nujj1042633805@gmail.com
* LastEditTime: 2024-02-18 16:39:18
 */
import { constructor } from "./msgConstructor.js";
import { EventEmitter } from "./eventEmitter.js";
import { destructor } from "./destructor.js";
import { media } from "./media.js";
import { output, ntCall } from "./utils.js";

let sendRecords = []

export const qmenu = []
export const qGuildMenu = []

// const ipcRenderer_on = LLAPI_PRE.ipcRenderer_LL_on;

class Api extends EventEmitter {
    /**
     * @description 监听新消息
     * @example
     * LLAPI.on("new-messages", (message) => {
     *    console.log(message);
     * })
     */
    /**
     * @description 聊天界面消息更新
     * @example
     * LLAPI.on("dom-up-messages", (node) => {
     *    console.log(node);
     * })
     */
    /**
     * @description 监听QQ消息菜单打开事件
     * @tips 该事件可以使用qContextMenu
     *      event: 为事件
     *      target: 为右键位置的document
     *      msgIds: 为消息ID
     * LLAPI.on("context-msg-menu", (event, target, msgIds) => {
     *    console.log(event);
     * })
     */
    /**
     * @description 添加消息编辑栏的内容(实验性)
     * @param {string|HTMLElement} message 消息内容
     * @returns true/false
     * @example
     * LLAPI.add_editor(message)
     * message:
     * {
     *      type: "text",
     *      content: "一条消息"
     * }
     * {
     *      type: "qqFace",
     *      id: "344",
     *      label: "[大怨种]",
     *      path: "appimg://H:/QQ/nt_qq/global/nt_data/Emoji/emoji-resource/sysface_res/apng/s344.png"
     * }
     * {
     *      type: "pic",
     *      src: PATH,
     *      picSubType: 0,
     * }
     */
    add_editor(message) {
        try {
            let emojiElement
            const ckeditorInstance = document.querySelector(".ck.ck-content.ck-editor__editable").ckeditorInstance;
            const editorModel = ckeditorInstance.model; // 获取编辑器的 model
            const editorSelection = editorModel.document.selection; // 获取光标的当前选择
            const position = editorSelection.getFirstPosition(); // 获取当前光标的位置
            editorModel.change(writer => {
                if (message.type == "qqFace") {
                    const data = {
                        type: "qqFace",
                        id: message.id,
                        label: message.label,
                        path: message.path,
                        animationData: {
                            packId: "1",
                            stickerId: "28",
                            stickerType: 1,
                            sourceType: 1,
                            resultId: "",
                            superisedId: "",
                            randomType: 1
                        }
                    }
                    const emojiData = {
                        data: JSON.stringify(data)
                    }
                    emojiElement = writer.createElement('msg-qqface', emojiData);
                } else if (message.type == "pic") {
                    const data = {
                        "type": "pic",
                        "src": message.src,
                        "picSubType": 0
                    }
                    const emojiData = {
                        data: JSON.stringify(data)
                    }
                    emojiElement = writer.createElement('msg-img', emojiData);
                } else if (message.type == "text") {
                    emojiElement = message.content
                }
                writer.insert(emojiElement, position);
            });
            return true
        } catch (error) {
            return false
        }
    }
    /**
     * @description 设置消息编辑栏的内容
     * @param {string|HTMLElement} message 消息内容
     * @returns true/false
     */
    set_editor(message) {
        try {
            const select = window.getSelection()
            document.querySelector(".ck.ck-content.ck-editor__editable").ckeditorInstance.setData(message)
            const msg_list = document.querySelector(".ck.ck-content p")
            select.collapse(msg_list.childNodes[msg_list.childNodes.length-1])
            select.modify("move", "forward", "paragraph");
            ///select.collapseToEnd()
            return true
        } catch (error) {
            return false
        }
    }
    /**
     * @description 删除消息编辑栏的指定类型内容(实验性)
     * @param {string} type 消息类型
     * @param {boolean} space 是否删除空格
     * @returns true/false
     */
    del_editor(type, space=false) {
        try {
            const ckeditorInstance = document.querySelector(".ck.ck-content.ck-editor__editable").ckeditorInstance;
            const editorModel = ckeditorInstance.model; // 获取编辑器的 model
            editorModel.change(writer => {
                const root = editorModel.document.getRoot()
                const firstParagraph = root.getChild(1) ?? root.getChild(0);
                if (firstParagraph && firstParagraph.is('element', 'paragraph')) {
                    // 获取所有子节点
                    const children = Array.from(firstParagraph.getChildren());
                    const find_children = children.find(child => child.name == type);
                    writer.remove(find_children);
                    if (space) {
                        // 获取当前的选择对象
                        const selection = editorModel.document.selection;
                        // 获取选择范围的起始位置
                        const position = selection.getFirstPosition();
                        // 创建一个新的范围，从当前位置向前偏移一个单位
                        const rangeToDelete = writer.createRange(
                            position.getShiftedBy(-1),
                            position
                        );
                        // 删除该范围内的内容
                        writer.remove(rangeToDelete);
                    }
                }
            });
            return true
        } catch (error) {
            return false
        }
    }
    /**
     * @description 获取消息编辑栏的内容
     * @returns {string|HTMLElement} message 消息内容
     */
    get_editor() {
        return document.querySelector(".ck.ck-content.ck-editor__editable").ckeditorInstance.getData()
    }
    /**
     * @description 添加聊天消息(不保存)(未完成)
     * @param {string|HTMLElement} peer 对方的ID
     * @param {string|HTMLElement} message 消息内容
     * @returns true/false
     */
    add_message_list(peer, message) {
        LLAPI_PRE.ipcRenderer_LL.send("___!add_message_list", peer, message);
    }
    /**
     * @description 添加QQ消息的右键菜单项目
     * @param {function} func 函数添加逻辑
     * @example func:
     * function abc(qContextMenu) {
     *     qContextMenu.insertAdjacentHTML('beforeend', separatorHTML)
     *     qContextMenu.insertAdjacentHTML('beforeend', repeatmsgHTML)
     * }
     */
    add_qmenu(...func) {
        qmenu.push(func)
    }
    /**
     * @description 添加QQ频道消息的右键菜单项目
     * @param {function} func 函数添加逻辑
     * @example func:
     * function abc(qContextMenu) {
     *     qContextMenu.insertAdjacentHTML('beforeend', separatorHTML)
     *     qContextMenu.insertAdjacentHTML('beforeend', repeatmsgHTML)
     * }
     */
    add_qGuildMenu(...func) {
        qGuildMenu.push(func)
    }
    /**
     * @description 获取当前用户信息
     * @returns uid: number, uin: number
     */
    async getAccountInfo() {
        return await ntCall("ns-GlobalDataApi", "fetchAuthData", []).then((data) => {
            if (!data) return;
            return { uid: data.uid, uin: data.uin };
        });
    }
    /**
     * @description 获取当前用户的详细信息
     * @param {number} uid QQ代号
     * @returns nickName: 名称, age: 年龄等
     */
    async getUserInfo(uid) {
        ntCall("ns-ntApi", "nodeIKernelProfileService/getUserSimpleInfo", [{force:true,uids:[uid]}, undefined]);
        return await new Promise((resolve) => {
            this.once("user-info-list", (args) => resolve(constructor.constructUser(args?.[1]?.[0]?.payload?.profiles?.get(uid))));
        });
    }
    /**
     * @description 获取当前聊天窗口的peer
     * @returns peer
     */
    async getPeer() {
        const peer = await eencode.getPeer();
        return peer;
    }
    /**
     * @description 发送消息
     * @param {Peer} peer 对方的ID
     * @param {MessageElement[]} elements
     * elements: [{
     *    type: "text",
     *    content: "一条消息"
        }]
     */
    async sendMessage(peer, elements) {
        ntCall("ns-ntApi", "nodeIKernelMsgService/sendMsg", [
            {
                msgId: "0",
                peer: destructor.destructPeer(peer),
                msgElements: await Promise.all(
                    elements.map(async (element) => {
                        if (element.type == "text") return destructor.destructTextElement(element);
                        else if (element.type == "reply") return destructor.destructReplyElement(element);
                        else if (element.type == "image") return destructor.destructImageElement(element, await media.prepareImageElement(element.file));
                        else if (element.type == "voice" || element.type == "ptt") return destructor.destructPttElement(element, await media.preparePttElement(element.file));
                        else if (element.type == "face") return destructor.destructFaceElement(element);
                        else if (element.type == "raw") return destructor.destructRawElement(element);
                        else return null;
                    }),
                ),
                msgAttributeInfos: new Map()
            },
            null,
        ]);
        function checkSendRecord() {
            return new Promise((resolve, reject) => {
                if (sendRecords.length > 0) {
                    resolve(sendRecords.pop());
                } else {
                    setTimeout(() => {
                        resolve(checkSendRecord());
                    }, 500);
                }
            });
        }
        return checkSendRecord()
    }
    /**
     * 撤回消息
     * @param {Peer} peer 对方的Peer
     * @param {string[]} msgIds 消息ID的列表
     */
    async recallMessage(peer, msgIds) {
        ntCall("ns-ntApi", "nodeIKernelMsgService/recallMsg", [
            {
                msgIds,
                peer: destructor.destructPeer(peer),
            },
            null,
        ]);
    }
    /**
     * @description 转发消息
     * @param {Peer} srcpeer 消息来源的Peer
     * @param {Peer} dstpeer 转发对象的Peer
     * @param {string[]} msgIds 消息ID的列表
     */
    async forwardMessage(srcpeer, dstpeer, msgIds) {
        ntCall("ns-ntApi", "nodeIKernelMsgService/forwardMsgWithComment", [
            {
                msgIds: msgIds,
                srcContact: destructor.destructPeer(srcpeer),
                dstContacts: [
                    destructor.destructPeer(dstpeer)
                ],
                commentElements: [],
                msgAttributeInfos: new Map()
            },
            null,
        ]);
    }
    /**
     * @description 获取好友列表
     * @param {boolean} forced 是否强制更新
     */
    async getFriendsList(forced = false) {
        ntCall("ns-ntApi", "nodeIKernelBuddyService/getBuddyList", [{ force_update: forced }, undefined]);
        return await new Promise((resolve) => {
            this.once("friends-list-updated", (list) => resolve(list));
        });
    }
    /**
     * @description 获取群组列表
     * @param {boolean} forced 是否强制更新
     */
    async getGroupsList(forced = false) {
        ntCall("ns-ntApi", "nodeIKernelGroupService/getGroupList", [{ forceFetch: forced }, undefined]);
        return await new Promise((resolve) => {
            this.once("groups-list-updated", (list) => resolve(list));
        });
    }
    /**
     * @description 获取历史聊天记录
     * @param {number} peer 对象的Peer
     * @param {string} startMsgId 起始消息ID
     * @returns
     */
    async getPreviousMessages(peer, count = 20, startMsgId = "0") {
        try {
            const msgs = await ntCall("ns-ntApi", "nodeIKernelMsgService/getMsgsIncludeSelf", [
                {
                    peer: destructor.destructPeer(peer),
                    msgId: startMsgId,
                    cnt: count,
                    queryOrder: true,
                },
                undefined,
            ]);
            const messages = (msgs.msgList).map((msg) => constructor.constructMessage(msg));
            return messages;
        } catch {
            return [];
        }
    }
    /**
     * @description 语音转文字(实验性)
     * @param {string} msgId 消息ID
     * @param {number} peer 对象的Peer
     * @param {MessageElement[]} elements
     */
    async Ptt2Text(msgId, peer, elements) {
        const msgElement = JSON.parse(JSON.stringify(elements))
        await ntCall("ns-ntApi", "nodeIKernelMsgService/translatePtt2Text", [
            {
                msgId: msgId,
                peer: destructor.destructPeer(peer),
                msgElement: msgElement
            },
            null
        ]);
    }
    /**
     * @description 获取群聊成员ID
     * @param {string} groupId 群聊ID
     * @param {number} num 数量
     */
    async getGroupMemberList(groupId, num=30) {
        let sceneId = await ntCall("ns-ntApi", "nodeIKernelGroupService/createMemberListScene", [{
            groupCode: groupId,
            scene: "groupMemberList_MainWindow"
        }])
        return await ntCall("ns-ntApi", "nodeIKernelGroupService/getNextMemberList", [
            {
                sceneId: sceneId,
                num: num
            },
            null
        ]);
    }
    /**
     * @description 重置登录信息
     * @param {string} uin QQ号
     */
    async resetLoginInfo(uin) {
        await ntCall("ns-ntApi", "nodeIKernelLoginService/resetLoginInfo", [
            {
                uin: uin
            },
            null
        ]);
    }
    /**
     * @description 发送好友赞
     * @param {String} uid qq代号
     * @param {Number} count 点赞次数，默认一次
     */
    async addLike(uid, count=1) {
        ntCall("ns-ntApi", "nodeIKernelProfileLikeService/setBuddyProfileLike", [
            {
                doLikeUserInfo:{
                    friendUid:uid,
                    sourceId:71,
                    doLikeCount:count,
                    doLikeTollCount:0
                }
            },
            null,
        ]);
    }
    async test() {
        const peer = await this.getPeer();
        await this.sendMessage(peer, [{
            type: "ptt",
            file: "H:/LiteLoader/xm2467.silk"
        }]);
    }
}

export const apiInstance = new Api();

// ipcRenderer_on('new_message-main', (event, args) => {
//     const messages = (args?.[1]?.[0]?.payload?.msgList).map((msg) => constructor.constructMessage(msg));
//     /**
//      * @description 获取新消息
//      */
//     apiInstance.emit("new-messages", messages);
// });
// ipcRenderer_on('new-send-message-main', (event, args) => {
//     // const messages = (args?.[1]?.[0]?.payload?.msgList).map((msg) => constructor.constructMessage(msg));
//     /**
//      * @description 消息发送成功
//      */
//     let sendMsg = args?.[1]?.[0]?.payload?.msgRecord
//     sendMsg = constructor.constructMessage(sendMsg)
//     /*
//     * {
//     *   msgId: string,
//     * }
//     * */
//     // console.log("new-send-message-main", sendMsg)
//     sendRecords.push(sendMsg)
//     apiInstance.emit("new-send-messages", [sendMsg]);
// });
// ipcRenderer_on('user-info-list-main', (event, args) => {
//     apiInstance.emit("user-info-list", args);
// });
// ipcRenderer_on('set_message-main', (event) => {
//     apiInstance.emit("set_message");
// });
// ipcRenderer_on('groups-list-updated-main', (event, args) => {
//     const groupsList = ((args[1]?.[0]?.payload?.groupList || [])).map((group) => constructor.constructGroup(group));
//     apiInstance.emit("groups-list-updated", groupsList);
// });
// ipcRenderer_on('friends-list-updated-main', (event, args) => {
//     const friendsList = [];
//     ((args?.[1]?.[0]?.payload?.data || [])).forEach((category) => friendsList.push(...((category?.buddyList || [])).map((friend) => constructor.constructUser(friend))));
//     apiInstance.emit("friends-list-updated", friendsList);
// });
// ipcRenderer_on('user-login-main', (event, userInfo) => {
//     apiInstance.emit("user-login", userInfo);
// });
Object.defineProperty(window, "_LLAPI", {
    value: apiInstance,
    writable: false,
});
Object.defineProperty(window, "_llapi", {
    value: apiInstance,
    writable: false,
});

// import { hookVue3 } from "./vue.js";
// hookVue3();