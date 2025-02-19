UEDITOR_CONFIG = window.UEDITOR_CONFIG || {};

var baidu = window.baidu || {};

window.baidu = baidu;

window.UE = baidu.editor = {
    plugins: {},
    commands: {},
    instants: {},
    I18N: {},
    _customizeUI: {},
    version: "4.3.0",
    plus: {
        fileExt: function (filename) {
            if (!filename) {
                return '';
            }
            var pcs = filename.split('.');
            if (pcs.length > 1) {
                return pcs.pop().toLowerCase();
            }
            return '';
        }
    },
    constants: {
        STATEFUL: {
            DISABLED: -1,
            OFF: 0,
            ON: 1,
        },
    }
};
var dom = (UE.dom = {});
