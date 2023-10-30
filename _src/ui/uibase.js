(function () {
    var utils = baidu.editor.utils,
        uiUtils = baidu.editor.ui.uiUtils,
        EventBase = baidu.editor.EventBase,
        UIBase = (baidu.editor.ui.UIBase = function () {
        });

    UIBase.prototype = {
        el: null,
        className: "",
        uiName: "",
        initOptions: function (options) {
            var me = this;
            for (var k in options) {
                me[k] = options[k];
            }
            this.id = this.id || "edui" + uiUtils.uid();
        },
        initUIBase: function () {
            this._globalKey = utils.unhtml(uiUtils.setGlobal(this.id, this));
        },
        render: function (holder) {
            var html = this.renderHtml();
            var el = uiUtils.createElementByHtml(html);

            //by xuheng 给每个node添加class
            var list = domUtils.getElementsByTagName(el, "*");
            var theme = "edui-" + (this.theme || this.editor.options.theme);
            var layer = document.getElementById("edui_fixedlayer");
            for (var i = 0, node; (node = list[i++]);) {
                domUtils.addClass(node, theme);
            }
            domUtils.addClass(el, theme);
            if (layer) {
                layer.className = "";
                domUtils.addClass(layer, theme);
            }

            var seatEl = this.getDom();
            if (seatEl != null) {
                seatEl.parentNode.replaceChild(el, seatEl);
                uiUtils.copyAttributes(el, seatEl);
            } else {
                if (typeof holder == "string") {
                    holder = document.getElementById(holder);
                }
                holder = holder || uiUtils.getFixedLayer();
                // console.log('Uibase.render',holder,el);
                domUtils.addClass(holder, theme);
                holder.appendChild(el);
            }
            this.el = el;
            this.postRender();
        },
        getDom: function (name) {
            if (!name) {
                return document.getElementById(this.id);
            } else {
                return document.getElementById(this.id + "_" + name);
            }
        },
        postRender: function () {
            this.fireEvent("postrender");
        },
        getHtmlTpl: function () {
            return "";
        },
        formatHtml: function (tpl) {
            var prefix = "edui-" + this.uiName;
            return tpl
                .replace(/##/g, this.id)
                .replace(/%%-/g, this.uiName ? prefix + "-" : "")
                .replace(/%%/g, (this.uiName ? prefix : "") + " " + this.className)
                .replace(/\$\$/g, this._globalKey);
        },
        renderHtml: function () {
            return this.formatHtml(this.getHtmlTpl());
        },
        dispose: function () {
            var box = this.getDom();
            if (box) baidu.editor.dom.domUtils.remove(box);
            uiUtils.unsetGlobal(this.id);
        },
        uiIsShow: true,
        uiShowStyleBackupValue: null,
        uiShow: function (enable) {
            if (enable) {
                if (this.uiIsShow) {
                    return;
                }
                this.getDom().style.display = this.uiShowStyleBackupValue;
                this.uiIsShow = true;
            } else {
                if (!this.uiIsShow) {
                    return;
                }
                this.uiShowStyleBackupValue = this.getDom().style.display;
                this.getDom().style.display = 'none';
                this.uiIsShow = false;
            }
        }
    };
    utils.inherits(UIBase, EventBase);
})();
