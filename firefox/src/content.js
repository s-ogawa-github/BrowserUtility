'use strict';

function make_open_tsvn_url(options) {
    const debug = options.Debug.Log;
    const option = options.Make_Open_tsvn_url;
    const url_base = option.SVN_URL;

    if (!option) {
        console.log("option[Make_Open_tsvn_url] is not found");
        return false;
    }

    // 引数のaタグ要素が”[rev番号-rev番号.*|rev番号.*|log.*](option.SVN_URL)”の形式であれば、data-tsvn-info属性を付与する
    function set_attr_tsvn_info(elem) {
        const lists = [
            ['^rev([0-9]+)-([0-9]+)(.*)', 'tsvn[log][$1,$2]'],
            ['^rev([0-9]+)(.*)', 'tsvn[log][$1,$1]'],
            ['^log(.*)', 'tsvn[log]'],
        ];
        if (elem.getAttribute('href') && elem.getAttribute('href').search(new RegExp(url_base, 'i')) != -1 && !elem.getAttribute('data-tsvn-info')) {
            for (let list of lists) {
                const attr = elem.innerHTML.replace(new RegExp(list[0], 'i'), list[1]);
                if (attr != elem.innerHTML) {
                    elem.setAttribute("data-tsvn-info", attr);
                    if (debug) console.log("setAttribute result: %o", elem);
                    break;
                }
            };
        }
    }

    if (option.Enable && option.Activate_URL && option.SVN_URL && location.href.search(new RegExp('^' + option.Activate_URL, 'i')) != -1) {
        // チケット説明文内のsvnリンクをOpen TortoiseSVNリンクに変換
        if (document.getElementsByClassName('description')[0] && document.getElementsByClassName('description')[0].getElementsByClassName('wiki')[0]) {
            for (let elem of document.getElementsByClassName('description')[0].getElementsByClassName('wiki')[0].getElementsByTagName('a')) {
                //if (debug) console.log("target of description wiki: %o", elem);
                set_attr_tsvn_info(elem);
            }
        }
        // チケット履歴内のsvnリンクをOpen TortoiseSVNリンクに変換
        if (document.getElementById('history')) {
            for (let elem of document.getElementById('history').getElementsByTagName('a')) {
                set_attr_tsvn_info(elem);
            }
        }
        // チケット説明文プレビュー内のsvnリンクをOpen TortoiseSVNリンクに変換
        let observerlists = {
            'preview':false,
            //'preview_issue_description':false,
            //'preview_issue_notes':false,
        };
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                //if (debug) console.log('target of preview: %o', mutation.target);
                for (let elem of mutation.target.getElementsByTagName('a')) {
                    set_attr_tsvn_info(elem);
                }
            });
        });
        if (document.getElementById('content') && document.getElementById('update')) {
            for (let elem of document.getElementById('content').getElementsByTagName('a')) {
                if (elem.getAttribute('onclick') && elem.getAttribute('onclick').search('"update"') != -1) {
                    if (debug) console.log('make_open_tsvn_url addEventListener click :%o', elem);
                    elem.addEventListener('click', function(event) {
                        if (!event.isTrusted) {
                            console.log('untrusted event!');
                            return;
                        }
                        for (let key in observerlists) {
                            if (document.getElementById(key) && !observerlists[key]) {
                                observerlists[key] = true;
                                observer.observe(document.getElementById(key), { childList: true, });
                                if (debug) console.log('start preview observing: %o', document.getElementById(key));
                            }
                        }
                    }, true);
                }
            }
            for (let elem of document.getElementById('update').getElementsByTagName('a')) {
                if (elem.getAttribute('onclick') && elem.getAttribute('onclick').search('#update') != -1) {
                    if (debug) console.log('make_open_tsvn_url addEventListener click:%o', elem);
                    elem.addEventListener('click', function(event) {
                        if (!event.isTrusted) {
                            console.log('untrusted event!');
                            return;
                        }
                        let need_disconnect = false;
                        for (let key in observerlists) {
                            if (observerlists[key]) {
                                observerlists[key] = false;
                                need_disconnect = true;
                            }
                        }
                        if (need_disconnect) {
                            observer.disconnect();
                            if (debug) console.log('stop preview observing');
                        }
                    }, true);
                }
            }
        }

        // 関係しているリビジョン内のsvnリンクからリビジョンの最小・最大番号を抽出してOpen TortoiseSVNリンクを生成
        let svnlists = [];
        for (let elem of document.getElementsByClassName('changeset')) {
            // 例:href="http://tama:7000/svn/EC/trunk/src/test?p=リビジョン番号"の文字列から'http://tama:7000/svn/EC/trunk/src/test'を抽出(httpから?まで)
            let url_full = elem.innerHTML.match(new RegExp('href="(' + url_base + '.*?)\\?', 'i'));
            if (!url_full || url_full[1].search(/(\<|\>|\&|\%|\"|\'|\|)/) != -1) continue;
            url_full = url_full[1];

            // 例:href="http://tama:7000/svn/EC/trunk/src/test?p=リビジョン番号の文字列から'http://tama:7000/svn/EC/trunk'を抽出)
            let base = elem.innerHTML.match(new RegExp('href="(' + url_base + '(.*?working\/|.*?branch\/|.*?trunk\/|.+?\/.+?\/)' + ')', 'i'));
            if (!base) continue;
            base = base[1].toLowerCase();

            // 例:href="http://tama:7000/svn/EC/trunk/src/test?p=リビジョン番号”の文字列から'リビジョン番号'を抽出(p=の後ろの数値)
            let rev = elem.innerHTML.match(new RegExp('href="' + url_full + '.*?\\?p=([0-9]+)', 'i'));
            if (!rev) continue;
            rev = Number(rev[1]);

            if (debug) console.log('url_full:%s base:%s rev:%s', url_full, base, rev);

            let match_base = svnlists.find((v) => v.base == base);
            if (match_base === undefined) {
                svnlists.push({base:base, url:url_full, rev_max:rev, rev_min:rev});
                continue;
            }

            if (match_base.url.toUpperCase() != url_full.toUpperCase()){
                //urlを先頭から一文字づつ比較し、一致しているかをチェック(大文字小文字の違いを無視するためにtoUpperCaseで比較する)
                for (let [i, v] of match_base.url.toUpperCase().split('').entries()) {
                    if (v != url_full.toUpperCase()[i]) {
                        //最長一致のurlから親ディレクトリを抽出
                        match_base.url = match_base.url.slice(0, i).replace(/(.*)\/.*/, '$1');
                        break;
                    }
                };
            }
            if (match_base.rev_min > rev) match_base.rev_min = rev;
            if (match_base.rev_max < rev) match_base.rev_max = rev;
        };
        if (document.getElementById('issue-changesets')) {
            for (let svn of svnlists) {
                let rev_str = 'rev' + svn.rev_min;
                if (svn.rev_min != svn.rev_max) rev_str = rev_str + '-' + svn.rev_max;
                let elem = document.getElementById('issue-changesets').insertAdjacentElement('afterbegin', document.createElement("a"));
                elem.setAttribute("href", svn.url);
                elem.setAttribute("data-tsvn-info", 'tsvn[log][' + svn.rev_min + ',' + svn.rev_max + ']');
                elem.textContent = rev_str + ' ' + svn.url;
                elem.insertAdjacentElement('afterend', document.createElement("br"));
            };
        }
    }
}

function open_file_path(options) {
    const debug = options.Debug.Log;
    const option = options.Open_File_Path;

    if (!option) {
        console.log("option[Open_File_Path] is not found");
        return false;
    }

    if (option.Enable && option.Activate_URL && option.Target_Path && option.Activate_URL && location.href.search(new RegExp('^' + option.Activate_URL, 'i')) != -1) {
        if (debug) console.log('open_file_path');

        function action(event) {
            let elem = event.target;
            let lists = [];
            //if (debug) console.log('open_file_path contextmenu_event: %o, %o', event, elem);

            if (!event.isTrusted) {
                console.log('untrusted event!');
                return;
            }

            if (['mousedown', 'click'].indexOf(event.type) != -1 && elem.tagName == 'A') {
                // リンクがローカルファイルの場合、コンテキストメニューにリンクを追加する
                if (elem.getAttribute('href')
                && (elem.getAttribute('href').search(new RegExp('^' + option.Target_Path + '$', 'i')) != -1
                ||  elem.getAttribute('href').search(new RegExp('^file:(\/){0,3}' + option.Target_Path + '$', 'i')) != -1)
                &&  elem.getAttribute('href').search(/(\<|\>|\&|\%|\"|\'|\|)/) == -1
                &&  elem.getAttribute('href').search(/(.bat|.exe|.vbs)$/i) == -1)
                {
                    let param = elem.getAttribute('href').replace(/file:(\/){0,3}/, '');
                    if (event.type == "mousedown") {
                        lists = [param];
                    }
                    else if (event.type == "click") {
                        // オプション有効時はリンククリックでファイルを開く
                        if (option.Link_Click) {
                            if (debug) console.log('open_file_path link clicked: %s', param);
                            try {
                                chrome.runtime.sendMessage({
                                    mode: "open_file_path",
                                    path: param
                                });
                            } catch (e) {
                                console.log("Error:sendMessage[open_file_path] %o", e.message);
                            }
                        }
                    }
                }
            }
            else if (['mousedown'].indexOf(event.type) != -1 && ['LI', 'P', 'PRE', 'DT', 'DD', 'DIV'].indexOf(elem.tagName) != -1) {
                // 指定要素にファイルパスがある場合、コンテキストメニューにリンクを追加する
                for (let child of elem.childNodes) {
                    if (child.nodeName == "#text") {
                        let match_list = [];
                        for (let v of child.nodeValue.split(/\r\n|\n|\r/)) {
                            let match = v.match(/http(s){0,1}:\/\/.*?(?=\s|\>|\"|\'|$)/ig);
                            let regexp = new RegExp('(\<|\\|)', 'ig');
                            if (!match) {
                                match = v.match(new RegExp(option.Target_Path, 'ig'));
                                regexp = new RegExp('(\<|\>|\&|\%|\"|\'|\\||(.bat|.exe|.vbs)$)', 'ig');
                            }
                            if (match) {
                                if (match_list.indexOf(match[0]) != -1) {
                                    if (debug) console.log('contextmenu skip for duplication: %s', match[0]);
                                }
                                else if (match[0].search(regexp) != -1) {
                                    if (debug) console.log('contextmenu skip for illegal string: %s', match[0]);
                                }
                                else {
                                    match_list.push(match[0]);
                                }
                            }
                        };
                        if (match_list.length > 0) {
                            if (event.type == "mousedown") {
                                lists = match_list;
                            }
                        }
                    }
                }
            }
            if (['mousedown'].indexOf(event.type) != -1) {
                // コンテキストメニューを更新
                if (debug) console.log('open_file_path contextmenu update: %o', lists);
                try {
                    chrome.runtime.sendMessage({
                        mode: "contextmenu",
                        lists: lists
                    });
                } catch (e) {
                    console.log("Error:sendMessage[contextmenu] %o", e.message);
                }
            }
        };
        document.body.addEventListener('mousedown', action, false);
        document.body.addEventListener('click', action, false);
    }
}

function force_open_in_ie(options) {
    const debug = options.Debug.Log;
    const option = options.Open_in_IE;

    if (!option) {
        console.log("option[Open_in_IE] is not found");
        return false;
    }

    if (option.Enable && option.Force_URL && location.href.search(new RegExp('^' + option.Force_URL, 'i')) != -1) {
        if (debug) console.log('force Open_in_IE');
        try {
            chrome.runtime.sendMessage({
                mode: "open_in_ie",
                path: location.href
            }, function(response) {
                if (debug) console.log("sendMessage[open_in_ie] received");
                window.open('about:blank','_self').close();
            });
        } catch (e) {
            console.log("Error:sendMessage[open_in_ie] %o", e.message);
        }
    }
}

(function () {
    try {
        // ページを開くと最初にオプションを取得する
        chrome.runtime.sendMessage({
            mode: "option"
        }, function(response) {
            if (response.options.Debug.Log) console.log("options: %o", response.options);
            force_open_in_ie(response.options);
            make_open_tsvn_url(response.options);
            open_file_path(response.options);
        });
    } catch (e) {
        console.log("Error:sendMessage[option] %o", e.message);
    }
})();
