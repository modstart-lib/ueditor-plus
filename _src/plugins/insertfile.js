/**
 * 插入附件
 */
UE.plugin.register("insertfile", function () {
    var me = this;

    function getFileIcon(url) {
        var ext = url.substr(url.lastIndexOf(".") + 1).toLowerCase(),
            maps = {
                "ai": "ai.svg",
                "apk": "apk.svg",
                "chm": "chm.svg",
                "css": "css.svg",
                "doc": "doc.svg",
                "docx": "docx.svg",
                "dwg": "dwg.svg",
                "gif": "gif.svg",
                "html": "html.svg",
                "jpeg": "jpeg.svg",
                "jpg": "jpg.svg",
                "log": "log.svg",
                "mp3": "mp3.svg",
                "mp4": "mp4.svg",
                "pdf": "pdf.svg",
                "png": "png.svg",
                "ppt": "ppt.svg",
                "pptx": "pptx.svg",
                "psd": "psd.svg",
                "rar": "rar.svg",
                "svg": "svg.svg",
                "torrent": "torrent.svg",
                "txt": "txt.svg",
                "unknown": "unknown.svg",
                "xls": "xls.svg",
                "xlsx": "xlsx.svg",
                "zip": "zip.svg",
            };
        return maps[ext] ? maps[ext] : maps["unknown"];
    }

    return {
        commands: {
            insertfile: {
                execCommand: function (command, filelist) {
                    filelist = utils.isArray(filelist) ? filelist : [filelist];

                    if (me.fireEvent("beforeinsertfile", filelist) === true) {
                        return;
                    }


                    //console.log('themePath',  );
                    var i,
                        item,
                        icon,
                        title,
                        html = "",
                        URL = me.getOpt("UEDITOR_HOME_URL"),
                        iconDir = me.options.themePath + me.options.theme + "/exts/";
                    for (i = 0; i < filelist.length; i++) {
                        item = filelist[i];
                        icon = iconDir + getFileIcon(item.url);
                        title =
                            item.title || item.url.substr(item.url.lastIndexOf("/") + 1);
                        html +=
                            '<p>' +
                            '<a style="background:#EEE;padding:10px;border-radius:5px;line-height:1.5em;display:inline-flex;align-items:center;" href="' +
                            item.url +
                            '" title="' +
                            title +
                            '" target="_blank">' +
                            '<img style="vertical-align:middle;margin-right:0.5em;height:1.5em;" src="' + icon + '" _src="' + icon + '" />' +
                            '<span style="color:#111111;line-height:1.5em;flex-grow:1;">' +
                            title +
                            "</span>" +
                            "</a>" +
                            "</p>";
                    }
                    me.execCommand("insertHtml", html);

                    me.fireEvent("afterinsertfile", filelist);
                }
            }
        }
    };
});
