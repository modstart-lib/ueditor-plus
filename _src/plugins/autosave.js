UE.plugin.register("autosave", function () {
    var me = this, saveKey = null;

    function save(editor) {
        var saveData;

        if (!editor.hasContents()) {
            //这里不能调用命令来删除， 会造成事件死循环
            saveKey && me.removePreferences(saveKey);
            return;
        }

        editor._autoSaveTimer = null;

        saveData = me.body.innerHTML;

        if (
            editor.fireEvent("beforeautosave", {
                content: saveData
            }) === false
        ) {
            return;
        }

        me.setPreferences(saveKey, saveData);

        editor.fireEvent("afterautosave", {
            content: saveData
        });
    }

    return {
        defaultOptions: {
            autoSaveEnable: true,
            autoSaveRestore: false,
            autoSaveKey: null,
        },
        bindEvents: {
            ready: function () {
                saveKey = me.getOpt('autoSaveKey');
                if (!saveKey) {
                    var _suffix = "_DraftsData", key = null;

                    if (me.key) {
                        key = me.key + _suffix;
                    } else {
                        key = (me.container.parentNode.id || "ue-common") + _suffix;
                    }
                    saveKey = (location.protocol + location.host + location.pathname).replace(
                        /[.:\/]/g,
                        "_"
                    ) + key;
                }
                if (me.getOpt('autoSaveRestore')) {
                    var data = me.getPreferences(saveKey);
                    if (data) {
                        me.body.innerHTML = data;
                    }
                }
                // console.log('saveKey', saveKey);
            },
            contentchange: function () {
                if (!me.getOpt("autoSaveEnable")) {
                    return;
                }

                if (!saveKey) {
                    return;
                }

                if (me._autoSaveTimer) {
                    window.clearTimeout(me._autoSaveTimer);
                }

                me._autoSaveTimer = window.setTimeout(function () {
                    save(me);
                }, 500);
            }
        },
        commands: {
            clear_auto_save_content: {
                execCommand: function (cmd, name) {
                    if (saveKey && me.getPreferences(saveKey)) {
                        me.removePreferences(saveKey);
                    }
                },
                notNeedUndo: true,
                ignoreContentChange: true
            },

            set_auto_save_content: {
                execCommand: function (cmd, name) {
                    save(me);
                },
                notNeedUndo: true,
                ignoreContentChange: true
            },

            get_auto_save_content: {
                execCommand: function (cmd, name) {
                    return me.getPreferences(saveKey) || "";
                },
                notNeedUndo: true,
                ignoreContentChange: true
            },

            auto_save_restore: {
                execCommand: function (cmd, name) {
                    if (saveKey) {
                        me.body.innerHTML =
                            me.getPreferences(saveKey) || "<p>" + domUtils.fillHtml + "</p>";
                        me.focus(true);
                    }
                },
                queryCommandState: function () {
                    return saveKey ? (me.getPreferences(saveKey) === null ? -1 : 0) : -1;
                },
                notNeedUndo: true,
                ignoreContentChange: true
            }
        }
    };
});
