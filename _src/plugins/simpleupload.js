/**
 * @description
 * 简单上传:点击按钮,直接选择文件上传
 * @author Jinqn
 * @date 2014-03-31
 */
UE.plugin.register("simpleupload", function () {
    var me = this,
        isLoaded = false,
        containerBtn;

    function initUploadBtn() {
        var input = document.createElement("input");
        input.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;font-size:0;opacity:0;';
        input.type = 'file';
        input.accept = me.getOpt('imageAllowFiles').join(',');
        containerBtn.appendChild(input);
        domUtils.on(input, 'click', function (e) {
            var toolbarCallback = me.getOpt("toolbarCallback");
            if (toolbarCallback) {
                if (true === toolbarCallback('simpleupload', me)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        });
        domUtils.on(input, 'change', function (e) {
            var state = me.queryCommandState("simpleupload");
            if (state === -1) {
                return;
            }
            if (!input.value) {
                return;
            }

            var loadingId = UE.dialog.loadingPlaceholder(me);

            if (!me.getOpt("imageActionName")) {
                UE.dialog.removeLoadingPlaceholder(me, loadingId);
                UE.dialog.tipError(me, me.getLang("autoupload.errorLoadConfig"));
                return;
            }

            var allowFiles = me.getOpt("imageAllowFiles");
            var filename = input.value, fileext = filename ? filename.substr(filename.lastIndexOf(".")) : "";
            if (
                !fileext ||
                (allowFiles &&
                    (allowFiles.join("") + ".").indexOf(fileext.toLowerCase() + ".") === -1)
            ) {
                UE.dialog.removeLoadingPlaceholder(me, loadingId);
                UE.dialog.tipError(me, me.getLang("autoupload.exceedTypeError"));
                return;
            }

            var successHandler = function (res) {
                const loader = me.document.getElementById(loadingId);
                domUtils.removeClasses(loader, "uep-loading");
                const link = me.options.imageUrlPrefix + res.url;
                loader.setAttribute("src", link);
                loader.setAttribute("_src", link);
                loader.setAttribute("alt", res.original || "");
                loader.removeAttribute("id");
                me.fireEvent("contentchange");
                // 触发上传图片事件
                me.fireEvent("uploadsuccess", {
                    res: res,
                    type: 'image'
                });
            };

            var errorHandler = function (err) {
                UE.dialog.removeLoadingPlaceholder(me, loadingId);
                UE.dialog.tipError(me, err);
            };

            var upload = function (file) {
                if(me.getOpt('uploadServiceEnable')){
                    me.getOpt('uploadServiceUpload')('image', file, {
                        success: function( res ) {
                            successHandler( res );
                        },
                        error: function( err ) {
                            errorHandler(me.getLang("simpleupload.loadError") + ' : ' + err);
                        },
                        progress: function( percent ) {

                        }
                    }, {
                        from: 'upload'
                    });
                    return;
                }
                const formData = new FormData();
                formData.append(me.getOpt('imageFieldName'), file, file.name);
                UE.api.requestAction(me, me.getOpt("imageActionName"), {
                    data: formData
                }).then(function (res) {
                    res = me.getOpt('serverResponsePrepare')( res.data )
                    if ('SUCCESS' === res.state && res.url) {
                        successHandler(res)
                    } else {
                        errorHandler(res.state);
                    }
                    input.value = '';
                }).catch(function (err) {
                    errorHandler(err)
                    input.value = '';
                });
            };
            var file = input.files[0];
            var fileExt = UE.plus.fileExt(file.name);
            // console.log('file',file);
            var imageCompressEnable = me.getOpt('imageCompressEnable'),
                imageMaxSize = me.getOpt('imageMaxSize'),
                imageCompressBorder = me.getOpt('imageCompressBorder');
            if (imageCompressEnable && ['jpg', 'jpeg', 'png'].includes(fileExt)) {
                UE.image.compress(file, {
                    maxSizeMB: imageMaxSize / 1024 / 1024,
                    maxWidthOrHeight: imageCompressBorder
                }).then(function (compressedFile) {
                    if (me.options.debug) {
                        console.log('UEditorPlus.SimpleUpload.CompressImage', (compressedFile.size / file.size * 100).toFixed(2) + '%');
                    }
                    upload(compressedFile);
                }).catch(function (err) {
                    console.error('UEditorPlus.SimpleUpload.CompressImage.error', err);
                    upload(file);
                });
            } else {
                upload(file);
            }
        });

        var stateTimer;
        me.addListener("selectionchange", function () {
            clearTimeout(stateTimer);
            stateTimer = setTimeout(function () {
                var state = me.queryCommandState("simpleupload");
                if (state === -1) {
                    input.disabled = "disabled";
                } else {
                    input.disabled = false;
                }
            }, 400);
        });
        isLoaded = true;
    }

    return {
        bindEvents: {
            ready: function () {
                //设置loading的样式
                utils.cssRule(
                    "loading",
                    ".uep-loading{display:inline-block;cursor:default;background: url('" +
                    this.options.themePath +
                    this.options.theme +
                    "/images/loading.gif') no-repeat center center transparent;border-radius:3px;outline:1px solid #EEE;margin-right:1px;height:22px;width:22px;}\n" +
                    ".uep-loading-error{display:inline-block;cursor:default;background: url('" +
                    this.options.themePath +
                    this.options.theme +
                    "/images/loaderror.png') no-repeat center center transparent;border-radius:3px;outline:1px solid #EEE;margin-right:1px;height:22px;width:22px;" +
                    "}",
                    this.document
                );
            },
            /* 初始化简单上传按钮 */
            simpleuploadbtnready: function (type, container) {
                containerBtn = container;
                me.afterConfigReady(initUploadBtn);
            }
        },
        outputRule: function (root) {
            utils.each(root.getNodesByTagName("img"), function (n) {
                if (/\b(uep\-loading\-error)|(bloaderrorclass)\b/.test(n.getAttr("class"))) {
                    n.parentNode.removeChild(n);
                }
            });
        },
        commands: {
            simpleupload: {
                queryCommandState: function () {
                    return isLoaded ? 0 : -1;
                }
            }
        }
    };
});
