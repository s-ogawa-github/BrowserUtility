var options = {
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

function save_options() {
    var e_Make_Open_tsvn_url = document.getElementById('Make Open Tsvn URL');
    options.Make_Open_tsvn_url.Enable = e_Make_Open_tsvn_url.getElementsByClassName('Enable')[0].checked;
    options.Make_Open_tsvn_url.Activate_URL = e_Make_Open_tsvn_url.getElementsByClassName('Activate URL')[0].value;
    options.Make_Open_tsvn_url.SVN_URL = e_Make_Open_tsvn_url.getElementsByClassName('SVN URL')[0].value;

    var e_Open_File_Path = document.getElementById('Open File Path');
    options.Open_File_Path.Enable = e_Open_File_Path.getElementsByClassName('Enable')[0].checked;
    options.Open_File_Path.Link_Click = e_Open_File_Path.getElementsByClassName('Link Click')[0].checked;
    options.Open_File_Path.Activate_URL = e_Open_File_Path.getElementsByClassName('Activate URL')[0].value;
    options.Open_File_Path.Target_Path = e_Open_File_Path.getElementsByClassName('Target Path')[0].value;

    var e_Open_in_IE = document.getElementById('Open in IE');
    options.Open_in_IE.Enable = e_Open_in_IE.getElementsByClassName('Enable')[0].checked;
    options.Open_in_IE.Force_URL = e_Open_in_IE.getElementsByClassName('Force URL')[0].value;

    var e_Debug = document.getElementById('Debug');
    options.Debug.Log = e_Debug.getElementsByClassName('Log')[0].checked;

    if (options.Make_Open_tsvn_url.Activate_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
    ||  options.Make_Open_tsvn_url.SVN_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
    ||  options.Open_File_Path.Activate_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
    ||  options.Open_File_Path.Target_Path.search(/(\<|\>|\&|\%|\"|\')/) != -1)
    {
        document.getElementById('status').textContent = 'Error: < > & % " \' can not used.';
        setTimeout(function() {
            document.getElementById('status').textContent = '';
            document.getElementById('status').insertAdjacentElement('beforeend', document.createElement("br"));
        }, 1000);
    }
    else {
        chrome.storage.local.set({
            options: options
        }, function() {
            document.getElementById('status').textContent = 'Options saved.';
            setTimeout(function() {
                document.getElementById('status').textContent = '';
                document.getElementById('status').insertAdjacentElement('beforeend', document.createElement("br"));
            }, 1000);
        });
    }
}

function restore_options() {
    chrome.storage.local.get({
        options
    }, function(items) {
        var option;

        option = items.options.Make_Open_tsvn_url;
        var e_Make_Open_tsvn_url = document.getElementById('Make Open Tsvn URL');
        e_Make_Open_tsvn_url.getElementsByClassName('Enable')[0].checked = option.Enable;
        e_Make_Open_tsvn_url.getElementsByClassName('Activate URL')[0].value = option.Activate_URL;
        e_Make_Open_tsvn_url.getElementsByClassName('SVN URL')[0].value = option.SVN_URL;

        option = items.options.Open_File_Path;
        var e_Open_File_Path = document.getElementById('Open File Path');
        e_Open_File_Path.getElementsByClassName('Enable')[0].checked = option.Enable;
        e_Open_File_Path.getElementsByClassName('Link Click')[0].checked = option.Link_Click;
        e_Open_File_Path.getElementsByClassName('Activate URL')[0].value = option.Activate_URL;
        e_Open_File_Path.getElementsByClassName('Target Path')[0].value = option.Target_Path;

        option = items.options.Open_in_IE;
        var e_Open_in_IE = document.getElementById('Open in IE');
        e_Open_in_IE.getElementsByClassName('Enable')[0].checked = option.Enable;
        e_Open_in_IE.getElementsByClassName('Force URL')[0].value = option.Force_URL;

        option = items.options.Debug;
        var e_Debug = document.getElementById('Debug');
        e_Debug.getElementsByClassName('Log')[0].checked = option.Log;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('Save').addEventListener('click', save_options);
