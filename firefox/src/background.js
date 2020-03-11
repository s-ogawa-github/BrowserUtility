'use strict';

const HOSTAPP_VER = '0.0.1'

let options = {
    Make_Open_tsvn_url : {
        Enable: false,
        Activate_URL : '',
        SVN_URL : ''
    },
    Open_File_Path : {
        Enable: false,
        Link_Click: false,
        Activate_URL : '',
        Target_Path : ''
    },
    Open_in_IE : {
        Enable: false,
        Force_URL : ''
    },
    Debug : {
        Log: false
    }
};

let states = {
    contextmenu : {
        open_file_path : Array(10)
    }
};

const id_open_file_path = [...Array(10).keys()].map(i => "open_file_path" + i);

function contextmenu_create() {
    const debug = options.Debug.Log;

    chrome.contextMenus.removeAll();
    states.contextmenu.open_file_path = [];

    if (options.Open_File_Path.Enable || options.Open_in_IE.Enable) {
        if (debug) console.log("contextmenu create");
        chrome.contextMenus.create({
            "title" : "Browser Utility",
            "id" : "parent",
            "type" : "normal",
            "contexts" : ["all"]
        });
        if (options.Open_in_IE.Enable) {
            chrome.contextMenus.create({
                "title" : "Open in IE (Browser Utility)",
                "id" : "open_in_ie",
                "type" : "normal",
                "parentId" : "parent"
            });
        }
        if (options.Open_File_Path.Enable) {
            for (let [i, v] of id_open_file_path.entries()) {
                chrome.contextMenus.create({
                    "title" : "",
                    "id" : v,
                    "type" : "separator",
                    "contexts" : ["page_action"],
                    "parentId" : "parent"
                });
                states.contextmenu.open_file_path[i] = '';
            }
        }
    }
}

function contextmenu_update(lists) {
    const debug = options.Debug.Log;
    if (debug) console.log("contextmenu_update: %o", lists);

    for (let [i, v] of id_open_file_path.entries()) {
        if(i < lists.length) {
            chrome.contextMenus.update(v, {
                "title" : lists[i],
                "type" : "normal",
                "contexts" : ["all"],
                "parentId" : "parent"
            });
            states.contextmenu.open_file_path[i] = lists[i];
        }
        else {
            chrome.contextMenus.update(v, {
                "title" : "",
                "type" : "separator",
                "contexts" : ["page_action"],
                "parentId" : "parent"
            });
            states.contextmenu.open_file_path[i] = '';
        }
    }
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    const debug = options.Debug.Log;
    if (info.menuItemId.indexOf('open_file_path') !== -1) {
        let agent = window.navigator.userAgent.toLowerCase();
        let firefox = (agent.indexOf('firefox') !== -1);
        const id = id_open_file_path.findIndex(i => i === info.menuItemId)
        const path = states.contextmenu.open_file_path[id];
        if (debug) console.log("contextMenus click: %s, %s, %d", info.menuItemId, path, firefox);
        if (firefox) {
            try {
                chrome.runtime.sendNativeMessage("browser_utility_host_app", {
                    version: HOSTAPP_VER,
                    mode: 'open_in_firefox',
                    path: encodeURI(path)
                }, function(response) {
                    if (debug) console.log("sendNativeMessage[open_in_firefox] rceived " + response);
                });
            } catch (e) {
                console.log("Error:sendNativeMessage[open_in_firefox] %o", e.message);
            }
        }
        else {
            chrome.tabs.create({
                url: path,
                index: tab.index + 1,
            });
        }
    }
    else if (info.menuItemId == "open_in_ie") {
        if (tab.url.search(/^http/) != -1) {
            if (debug) console.log("contextMenus click: %s, %s", info.menuItemId, tab.url);
            try {
                chrome.runtime.sendNativeMessage("browser_utility_host_app", {
                    version: HOSTAPP_VER,
                    mode: 'open_in_ie',
                    path: encodeURI(tab.url)
                }, function(response) {
                    if (debug) console.log("sendNativeMessage[open_in_ie] received " + response);
                });
            } catch (e) {
                console.log("Error:sendNativeMessage[open_in_ie] %o", e.message);
            }
        }
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const debug = options.Debug.Log;
    if (request.mode == "open_file_path") {
        // request.pathを開く
        let agent = window.navigator.userAgent.toLowerCase();
        let firefox = (agent.indexOf('firefox') !== -1);
        if (debug) console.log("open_file_path onMessage event: %s, %d", request.path, firefox);
        if (firefox) {
            try {
                chrome.runtime.sendNativeMessage("browser_utility_host_app", {
                    version: HOSTAPP_VER,
                    mode: 'open_in_firefox',
                    path: encodeURI(request.path)
                }, function(response) {
                    if (debug) console.log("sendNativeMessage[open_in_firefox] received " + response);
                });
            } catch (e) {
                console.log("Error:sendNativeMessage[open_in_firefox] %o", e.message);
            }
        }
        else {
            chrome.tabs.create({
                url: request.path,
                index: sender.tab.index + 1,
            });
        }
    }
    else if (request.mode == "open_in_ie") {
        try {
            chrome.runtime.sendNativeMessage("browser_utility_host_app", {
                version: HOSTAPP_VER,
                mode: 'open_in_ie',
                path: encodeURI(request.path)
            }, function(response) {
                if (debug) console.log("sendNativeMessage[open_in_ie] received " + response);
                sendResponse();
            });
        } catch (e) {
            console.log("Error:sendNativeMessage[open_in_ie] %o", e.message);
        }
    }
    else if (request.mode == "contextmenu") {
        // request.listsの内容でコンテキストメニューを更新
        contextmenu_update(request.lists);
    }
    else if (request.mode == "option") {
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
