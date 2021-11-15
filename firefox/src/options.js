var options = {
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

function copy_param(target, section, option_name, elem, elem_type, elem_to_option) {
    if (elem_to_option) {
        target[section][option_name] = elem[elem_type];
    } else {
        elem[elem_type] = (target[section][option_name] !== undefined) ? target[section][option_name] : options[section][option_name];
    }
}

function copy_options(target, is_save) {
    var elem;

    elem = 'Make Open-tsvn-url';
    section = 'Make_Open_tsvn_url';
    copy_param(target, section, 'Enable', document.getElementById(elem).getElementsByClassName('Enable')[0], 'checked', is_save);
    copy_param(target, section, 'Activate_URL', document.getElementById(elem).getElementsByClassName('Activate URL')[0], 'value', is_save);
    copy_param(target, section, 'SVN_URL', document.getElementById(elem).getElementsByClassName('SVN URL')[0], 'value', is_save);
    copy_param(target, section, 'Branch_Path', document.getElementById(elem).getElementsByClassName('Branch Path')[0], 'value', is_save);
    copy_param(target, section, 'Trunk_Path', document.getElementById(elem).getElementsByClassName('Trunk Path')[0], 'value', is_save);
    copy_param(target, section, 'Working_Path', document.getElementById(elem).getElementsByClassName('Working Path')[0], 'value', is_save);
    copy_param(target, section, 'ContextMenu', document.getElementById(elem).getElementsByClassName('ContextMenu')[0], 'checked', is_save);

    elem = 'Make Porting-to-Branch';
    section = 'Make_Porting_to_Branch';
    copy_param(target, section, 'Enable', document.getElementById(elem).getElementsByClassName('Enable')[0], 'checked', is_save);
    copy_param(target, section, 'Activate_URL', document.getElementById(elem).getElementsByClassName('Activate URL')[0], 'value', is_save);
    copy_param(target, section, 'Reference_Ticket', document.getElementById(elem).getElementsByClassName('Reference Ticket')[0], 'value', is_save);
    copy_param(target, section, 'Excluded_Project', document.getElementById(elem).getElementsByClassName('Excluded Project')[0], 'value', is_save);
    copy_param(target, section, 'Excluded_Status', document.getElementById(elem).getElementsByClassName('Excluded Status')[0], 'value', is_save);
    copy_param(target, section, 'CheckBox_Name', document.getElementById(elem).getElementsByClassName('CheckBox Name')[0], 'value', is_save);
    copy_param(target, section, 'InputArea_Name', document.getElementById(elem).getElementsByClassName('InputArea Name')[0], 'value', is_save);

    elem = 'Debug';
    section = 'Debug';
    copy_param(target, section, 'Log', document.getElementById(elem).getElementsByClassName('Log')[0], 'checked', is_save);
}

function save_options() {
    copy_options(options, true);

    if (options.Make_Open_tsvn_url.Activate_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
    ||  options.Make_Open_tsvn_url.SVN_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
    ||  options.Make_Porting_to_Branch.Activate_URL.search(/(\<|\>|\&|\%|\"|\')/) != -1
       ) {
        document.getElementById('status').textContent = 'Error: < > & % " \' can not used for URL.';
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
        copy_options(items.options, false);
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('Save').addEventListener('click', save_options);
