'use strict';

function make_open_tsvn_url(options) {
    const debug = options.Debug.Log;
    const option = options.Make_Open_tsvn_url;
    const url_base = option.SVN_URL;

    if (!option) {
        console.log("option[Make_Open_tsvn_url] is not found");
        return false;
    }

    ////////////////////////////////////////////////////
    // Open TortoiseSVNリンク作成
    ////////////////////////////////////////////////////
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
        if (document.getElementById('content') && document.getElementById('content').getElementsByClassName('new_issue')) {
            for (let key in observerlists) {
                if (document.getElementById(key) && !observerlists[key]) {
                    observerlists[key] = true;
                    observer.observe(document.getElementById(key), { childList: true, });
                    if (debug) console.log('start preview observing: %o', document.getElementById(key));
                }
            }
        }
        else if (document.getElementById('content') && document.getElementById('update')) {
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
            let href = elem.getElementsByClassName('add_subversion_links_link')[0].getAttribute('href');
            // 例:http://tama:7000/svn/EC/trunk/src/test?p=リビジョン番号 の文字列から'http://tama:7000/svn/EC/trunk/src/test'と'リビジョン番号'を抽出
            if (href.search(new RegExp('^' + url_base, 'i')) == -1 || href.search(/(\<|\>|\&|\%|\"|\'|\|)/) != -1) continue;
            let url_full = href.split('?p=')[0];
            let rev = Number(href.split('?p=')[1]);

            // 例:href="http://tama:7000/svn/EC/trunk/src/test?p=リビジョン番号の文字列から'http://tama:7000/svn/EC/trunk'を抽出)
            let svn_type = 'Branch';
            let base = url_full.match(new RegExp(url_base + option.Branch_Path, 'i'));
            if (!base) {
                svn_type = 'Trunk';
                base = url_full.match(new RegExp(url_base + option.Trunk_Path, 'i'));
                if (!base) {
                    svn_type = 'Working';
                    base = url_full.match(new RegExp(url_base + option.Working_Path, 'i'));
                    if (!base) {
                        if (debug) console.log('not match url_full:%s', url_full);
                        continue;
                    }
                }
            }
            base = base[0].toLowerCase();

            if (debug) console.log('type:%s rev:%s base:%s url_full:%s', svn_type, rev, base, url_full);

            let match_base = svnlists.find((v) => v.base == base);
            if (match_base === undefined) {
                svnlists.push({base:base, url:url_full, rev_max:rev, rev_min:rev, type:svn_type});
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
                    else if (i == url_full.length - 1) {
                        if (i < match_base.url.length - 1 && match_base.url[i+1] == '/') {
                            match_base.url = match_base.url.slice(0, i+1);
                        }
                        else {
                            //最長一致のurlから親ディレクトリを抽出
                            match_base.url = match_base.url.slice(0, i+1).replace(/(.*)\/.*/, '$1');
                        }
                        break;
                    }
                    else if (i == match_base.url.length - 1) {
                        if (i < url_full.length - 1 && url_full[i+1] == '/') {
                            match_base.url = url_full.slice(0, i+1);
                        }
                        else {
                            //最長一致のurlから親ディレクトリを抽出
                            match_base.url = url_full.slice(0, i+1).replace(/(.*)\/.*/, '$1');
                        }
                        break;
                    }
                };
            }
            if (match_base.rev_min > rev) match_base.rev_min = rev;
            if (match_base.rev_max < rev) match_base.rev_max = rev;
        };
        let svn_types = ["Branch", "Trunk", "Working"];
        let open_tsvn_urls = {}
        if (document.getElementById('issue-changesets') && svnlists.length > 0) {
            for (let type of svn_types) {
                let svns = svnlists.filter((v) => {return v.type == type;});
                open_tsvn_urls[type] = new Array();
                if (svns.length > 0) {
                    for (let svn of svns) {
                        let rev_str = 'rev' + svn.rev_min;
                        if (svn.rev_min != svn.rev_max) rev_str = rev_str + '-' + svn.rev_max;
                        let elem = document.getElementById('issue-changesets').insertAdjacentElement('afterbegin', document.createElement("a"));
                        elem.setAttribute("href", svn.url);
                        elem.setAttribute("data-tsvn-info", 'tsvn[log][' + svn.rev_min + ',' + svn.rev_max + ']');
                        elem.textContent = rev_str + ' ' + svn.url;
                        elem.insertAdjacentElement('afterend', document.createElement("br"));
                        open_tsvn_urls[type].push( '[' + rev_str + ' ' + svn.url + '](' + svn.url + ')\n' );
                    };
                    let elem = document.getElementById('issue-changesets').insertAdjacentElement('afterbegin', document.createElement("label"));
                    elem.textContent = '[' + type + ']';
                    elem.insertAdjacentElement('afterend', document.createElement("br"));
                }
            }

            let copy_review_comment = "Workingレビューをお願いします。\n"
            if (svnlists.find((v) => v.type == "Branch")) {
                copy_review_comment = "Trunk(Branch)レビューをお願いします。\n"
            }
            else if (svnlists.find((v) => v.type == "Trunk")) {
                copy_review_comment = "Trunkレビューをお願いします。\n"
            }
            for (let type of svn_types) {
                let urls = open_tsvn_urls[type]
                if (urls && urls.length > 0) {
                    copy_review_comment = copy_review_comment + "\n・" + type + "\n"
                    for (let url of urls) {
                        copy_review_comment = copy_review_comment + url
                    }
                }
            }
            if (debug) console.log('make_open_tsvn contextmenu update: %o', copy_review_comment);
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                if (request.mode == "copy_review_comment") {
                    if (debug) console.log('onMessage copy_review_commente: %o', copy_review_comment);
                    var input = document.createElement('textarea');
                    document.body.appendChild(input);
                    input.value = copy_review_comment;
                    input.focus();
                    input.select();
                    document.execCommand('Copy');
                    input.remove();
                }
            });
        }
    }
}

function make_porting_to_branch(options) {
    const debug = options.Debug.Log;
    const option = options.Make_Porting_to_Branch;

    if (!option) {
        console.log("option[Make_Porting_to_Branch] is not found");
        return false;
    }

    ////////////////////////////////////////////////////
    // 分岐への移植 リスト作成
    ////////////////////////////////////////////////////
    let elem_porting_to_branch = '';
    let elem_heads_up = '';
    let make_porting_to_branch_enabled = false;
    if (option.Enable && option.Activate_URL && option.Reference_Ticket && option.CheckBox_Name && option.InputArea_Name && location.href.search(new RegExp('^' + option.Activate_URL, 'i')) != -1) {
        // 編集(id=update)可能なページの場合は、機能有効
        if (document.getElementById('content') && document.getElementById('update')) {
            make_porting_to_branch_enabled = true;
            for (let elem of document.getElementById('all_attributes').getElementsByTagName('label')) {
                if (elem.innerText.search(new RegExp(option.InputArea_Name)) != -1) {
                    elem_porting_to_branch = elem.parentElement.getElementsByTagName('textarea')[0];
                }
            }
            for (let elem of document.getElementById('checklist_items').children) {
                if (elem.innerText.search(new RegExp(option.CheckBox_Name)) != -1) {
                    elem_heads_up = elem.children[0];
                }
            }
            if (!elem_porting_to_branch || !elem_heads_up) {
                // 「分岐への移植」「注意喚起」欄が存在しない場合は無効
                if (debug) console.log('make_porting_to_branch disable for no element %o, %o', elem_porting_to_branch, elem_heads_up);
                make_porting_to_branch_enabled = false;
            }
            if (option.Excluded_Project) {
                // 対象外プロジェクトだった場合は無効
                if (document.getElementById('header').getElementsByClassName('current-project')[0].innerHTML.search(new RegExp(option.Excluded_Project, 'i')) != -1) {
                    if (debug) console.log('make_porting_to_branch disable for excluded project');
                    make_porting_to_branch_enabled = false;
                }
            }
            if (option.Excluded_Status) {
                // 対象外ステータスだった場合は無効
                if (document.getElementById('content').getElementsByClassName('status attribute')[0].getElementsByClassName('value')[0].innerHTML.search(new RegExp(option.Excluded_Status, 'i')) != -1) {
                    if (debug) console.log('make_porting_to_branch disable for excluded status');
                    make_porting_to_branch_enabled = false;
                }
            }
        }
    }
    if (make_porting_to_branch_enabled) {
        for (let elem of document.getElementById('content').getElementsByTagName('a')) {
            // 編集(id=update)のリンクをクリックした時に動作
            if (elem.getAttribute('onclick') && elem.getAttribute('onclick').search('"update"') != -1) {
                if (debug) console.log('make_porting_to_branch addEventListener click :%o', elem);
                elem.addEventListener('click', function(event) {
                    if (!event.isTrusted) {
                        console.log('untrusted event!');
                        return;
                    }
                    // 現在の「分岐への移植」欄の内容を読み出す
                    if (!elem_heads_up.getAttribute('checked')) {
                        // 「注意喚起」欄にチェックされていない場合は、現在の「分岐への移植」欄のデフォルト値で更新して終了
                        if (debug) console.log('make_porting_to_branch disable for no check to HeadsUp');
                        elem_porting_to_branch.value = elem_porting_to_branch.defaultValue;
                        return;
                    }
                    // リファレンスチケットを一つずつ読み込む
                    const tickets = option.Reference_Ticket.replace(/ /g, '').split(',');
                    let porting_to_branches = Array(tickets.length);
                    for (let i = 0; i < porting_to_branches.length; i++) {
                        porting_to_branches[i] = ''; // 「分岐への移植」欄の記載内容初期値を空文字で設定
                    }
                    for (let ticket of tickets) {
                        if (debug) console.log('make_porting_to_branch reference ticket %o', ticket);
                        let open_url = location.href.replace(/(.*\/issues)\/.*/, '$1/' + ticket);
                        let xhr = new XMLHttpRequest();
                        xhr.open('GET', open_url, true);
                        xhr.onreadystatechange = function () {
                            if(xhr.readyState === 4 && xhr.status === 200) {
                                let parser = new DOMParser()
                                let xhrdoc = parser.parseFromString(xhr.responseText, "text/html")
                                // リファレンスチケットの「分岐への移植」欄の内容を読み出す
                                let ref_branches = '';
                                for (let elem of xhrdoc.getElementById('all_attributes').getElementsByTagName('label')) {
                                    if (elem.innerHTML.search('分岐への移植') != -1) {
                                        ref_branches = elem.parentElement.getElementsByTagName('textarea')[0].value;
                                        break;
                                    }
                                }
                                let ref_ticket = xhr.responseURL.split('issues/')[1].replace(/\/.*/, '');
                                for (let ref_branch of ref_branches.split(/\n/)) {
                                    if (!ref_branch) {
                                        continue;
                                    }
                                    let branch_exist = false;
                                    for (let current_branch of elem_porting_to_branch.defaultValue.split(/\n/)) {
                                        // リファレンスチケットの「分岐への移植」欄にあるリポジトリが現在のチケットに存在している場合は、スキップ
                                        if (ref_branch.split(':')[0] == current_branch.split(':')[0]) {
                                            branch_exist = true;
                                            break;
                                        }
                                    }
                                    // リファレンスチケットの「分岐への移植」欄にあるリポジトリが現在のチケットに存在しない場合は、新規追加する
                                    if (!branch_exist) {
                                        porting_to_branches[tickets.indexOf(ref_ticket)] += ref_branch.split(':')[0] + ': (Check)\n'
                                    }
                                    if (debug) console.log('make_porting_to_branch ref_ticket %o, index %o', ref_ticket, tickets.indexOf(ref_ticket));
                                }
                                if (debug) console.log('make_porting_to_branch porting_to_branches %o', porting_to_branches);
                                // 現在のチケットの「分岐への移植」欄を更新する
                                elem_porting_to_branch.value = elem_porting_to_branch.defaultValue + porting_to_branches.join('');
                            }
                        };
                        xhr.send();
                    }
                }, true);
            }
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
            make_open_tsvn_url(response.options);
            make_porting_to_branch(response.options);
        });
    } catch (e) {
        console.log("Error:sendMessage[option] %o", e.message);
    }
})();
