'use strict';

let options = {
    Make_Open_tsvn_url : {
        Enable: false,
        Activate_URL : '',
        SVN_URL : '',
        Branch_Path : '(.*?/){0,2}branches.*/(.+?/){0,2}',
        Trunk_Path : '(.*?/){0,2}trunk/',
        Working_Path : '(.*?/){0,2}working/.+?/.+?/.+?/(.+?(?=/|$))',
        ContextMenu: false
    },
    Make_Porting_to_Branch : {
        Enable: false,
        Activate_URL : '',
        Reference_Ticket : '',
        Excluded_Project : '',
        Excluded_Status : '終了',
        CheckBox_Name : '注意喚起',
        InputArea_Name : '分岐への移植'
    },
    Debug : {
        Log: false
    }
};

function contextmenu_create() {
    const debug = options.Debug.Log;

    chrome.contextMenus.removeAll();

    if (options.Make_Open_tsvn_url.ContextMenu) {
        if (debug) console.log("contextmenu create");
        chrome.contextMenus.create({
            "title" : "Browser Utility",
            "id" : "parent",
            "type" : "normal",
            "contexts" : ["all"]
        });
        if (options.Make_Open_tsvn_url.ContextMenu) {
            chrome.contextMenus.create({
                "title" : "Copy Review Comment",
                "id" : "copy_review_comment",
                "type" : "normal",
                "contexts" : ["all"],
                "parentId" : "parent"
            });
        }
    }
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    const debug = options.Debug.Log;
    if (debug) console.log("contextMenus click: info = %o, tab = %o", info, tab);
    if (info.menuItemId == "copy_review_comment") {
        if (debug) console.log("contextMenus copy_review_comment");
        try {
            chrome.tabs.sendMessage(tab.id, {
                mode: "copy_review_comment"
            });
        } catch (e) {
            console.log("Error:sendMessage[copy_review_comment] %o", e.message);
        }
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const debug = options.Debug.Log;
    if (debug) console.log("onMessage: request = %o, sender = %o", request, sender);
    if (request.mode == "option") {
        // オプションを取得してcontentスクリプトに渡す&オプション有効時はコンテキストメニューを作る
        chrome.storage.local.get({
            options
        }, function(items) {
            options = items.options;
            sendResponse({
                options: items.options
            });
            if (debug) console.log("options: %o", options);
            contextmenu_create();
        });
        return true;
    }
});

// 拡張機能ロード時は最初にオプションを取得する
chrome.storage.local.get({
    options
}, function(items) {
    options = items.options;
});
