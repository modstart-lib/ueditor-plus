(function () {
    UE.Editor.prototype.loadServerConfig = function () {
        var me = this;
        setTimeout(function () {

            if(me.options.loadConfigFromServer===false){
                return;
            }

            try {
                me.options.imageUrl &&
                me.setOpt(
                    "serverUrl",
                    me.options.imageUrl.replace(
                        /^(.*[\/]).+([\.].+)$/,
                        "$1controller$2"
                    )
                );

                var configUrl = me.getActionUrl("config"),
                    isJsonp = utils.isCrossDomainUrl(configUrl);

                /* 发出ajax请求 */
                me._serverConfigLoaded = false;

                configUrl &&
                UE.ajax.request(configUrl, {
                    method: "GET",
                    dataType: isJsonp ? "jsonp" : "",
                    headers: me.options.serverHeaders || {},
                    onsuccess: function (r) {
                        try {
                            var config = isJsonp ? r : eval("(" + r.responseText + ")");
                            config = me.options.serverResponsePrepare( config )
                            // console.log('me.options.before', me.options.audioConfig);
                            me.options = utils.merge(me.options, config);
                            // console.log('server.config', config.audioConfig);
                            // console.log('me.options.after', me.options.audioConfig);
                            me.fireEvent("serverConfigLoaded");
                            me._serverConfigLoaded = true;
                        } catch (e) {
                            showErrorMsg(me.getLang("loadconfigFormatError")+':'+e);
                        }
                    },
                    onerror: function () {
                        showErrorMsg(me.getLang("loadconfigHttpError"));
                    }
                });


            } catch (e) {
                showErrorMsg(me.getLang("loadconfigError"));
            }
        });

        function showErrorMsg(msg) {
            console && console.error(msg);
            //me.fireEvent('showMessage', {
            //    'title': msg,
            //    'type': 'error'
            //});
        }
    };

    UE.Editor.prototype.isServerConfigLoaded = function () {
        var me = this;
        return me._serverConfigLoaded || false;
    };

    UE.Editor.prototype.afterConfigReady = function (handler) {
        if (!handler || !utils.isFunction(handler)) return;
        var me = this;
        var readyHandler = function () {
            handler.apply(me, arguments);
            me.removeListener("serverConfigLoaded", readyHandler);
        };

        if (me.isServerConfigLoaded()) {
            handler.call(me, "serverConfigLoaded");
        } else {
            me.addListener("serverConfigLoaded", readyHandler);
        }
    };
})();
