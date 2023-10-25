UE.dialog = (function () {
    return {
        loadingPlaceholder: function (me) {
            var loadingId = "loading_" + (+new Date()).toString(36);
            me.focus();
            me.execCommand(
                "inserthtml",
                '<img class="uep-loading" id="' +
                loadingId +
                '" src="' +
                me.options.themePath +
                me.options.theme +
                '/images/spacer.gif">'
            );
            return loadingId;
        },
        removeLoadingPlaceholder: function (me, loadingId) {
            var loader = me.document.getElementById(loadingId);
            if (loader) {
                domUtils.remove(loader, false);
            }
        },
        tipError: function (me, title) {
            me.fireEvent("showmessage", {
                content: title,
                type: "error",
                timeout: 4000
            });
        }
    }
})();
