UEDITOR_CONFIG = window.UEDITOR_CONFIG || {};

var baidu = window.baidu || {};

window.baidu = baidu;

window.UE = baidu.editor = {
    plugins: {},
    commands: {},
    instants: {},
    I18N: {},
    _customizeUI: {},
    version: "3.6.0-beta",
    constants: {
        STATEFUL: {
            DISABLED: -1,
            OFF: 0,
            ON: 1,
        },
    }
};
var dom = (UE.dom = {});
