///import core
///commands       弹出菜单
// commandsName  popupmenu
///commandsTitle  弹出菜单
/**
 * 弹出菜单
 * @function
 * @name baidu.editor.plugins.popupmenu
 * @author xuheng
 */

UE.plugins["shortcutmenu"] = function () {
    var me = this,
        menu,
        items = me.options.shortcutMenu || [];

    if (!items.length) {
        return;
    }

    // contextmenu
    me.addListener("mouseup", function (type, e) {
        var me = this,
            customEvt = {
                type: type,
                target: e.target || e.srcElement,
                screenX: e.screenX,
                screenY: e.screenY,
                clientX: e.clientX,
                clientY: e.clientY
            };
        // console.log('shortcutmenu.mouseup', e, e.target, me.selection.getRange());

        setTimeout(function () {
            // console.log(e, me.selection.getRange());
            // var rng = me.selection.getRange();
            // if (rng.collapsed) {
            //     return;
            // }
            // if (rng.collapsed === false || type === "contextmenu") {
            // 未选中文字情况下不显示
            // if (!me.selection.getText()) {
            //     return
            // }
            if (!menu) {
                menu = new baidu.editor.ui.ShortCutMenu({
                    editor: me,
                    items: items.concat([]),
                    theme: me.options.theme,
                    className: "edui-shortcutmenu"
                });

                menu.render();
                me.fireEvent("afterrendershortcutmenu", menu);
            }
            menu.show(customEvt, !!UE.plugins["contextmenu"]);
            // }
        });

        if (type === "contextmenu") {
            domUtils.preventDefault(e);
            if (browser.ie9below) {
                var ieRange;
                try {
                    ieRange = me.selection.getNative().createRange();
                } catch (e) {
                    return;
                }
                if (ieRange.item) {
                    var range = new dom.Range(me.document);
                    range.selectNode(ieRange.item(0)).select(true, true);
                }
            }
        }
    });

    me.addListener("keydown", function (type) {
        if (type === "keydown") {
            menu && !menu.isHidden && menu.hide();
        }
    });
};
