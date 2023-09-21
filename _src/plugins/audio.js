UE.plugins["audio"] = function () {
    var me = this;

    function createAudioHtml(url, param) {
        param = param || {};
        var str = [
            "<audio",
            (param.id ? ' id="' + param.id + '"' : ""),
            (param.cls ? ' class="' + param.cls + '"' : ''),
            ' controls >',
            '<source src="' + url + '" type="audio/mpeg' + '" />',
            '</audio>',
        ];
        return str.join('');
    }

    function switchImgAndAudio(root, img2audio) {
        // utils.each(
        //     root.getNodesByTagName(img2audio ? "img" : "embed audio"),
        //     function (node) {
        //         var className = node.getAttr("class");
        //         if (className && className.indexOf("edui-faked-audio") != -1) {
        //             var html = createAudioHtml(
        //                 img2audio ? node.getAttr("_url") : node.getAttr("src"),
        //                 node.getAttr("width"),
        //                 node.getAttr("height"),
        //                 null,
        //                 node.getStyle("float") || "",
        //                 className,
        //                 img2audio ? "embed" : "image"
        //             );
        //             node.parentNode.replaceChild(UE.uNode.createElement(html), node);
        //         }
        //         if (className && className.indexOf("edui-upload-audio") != -1) {
        //             var html = createAudioHtml(
        //                 img2audio ? node.getAttr("_url") : node.getAttr("src"),
        //                 node.getAttr("width"),
        //                 node.getAttr("height"),
        //                 null,
        //                 node.getStyle("float") || "",
        //                 className,
        //                 img2audio ? "audio" : "image"
        //             );
        //             node.parentNode.replaceChild(UE.uNode.createElement(html), node);
        //         }
        //     }
        // );
    }

    me.addOutputRule(function (root) {
        switchImgAndAudio(root, true);
    });
    me.addInputRule(function (root) {
        switchImgAndAudio(root);
    });

    me.commands["insertaudio"] = {
        execCommand: function (cmd, audioObjs, type) {
            audioObjs = utils.isArray(audioObjs) ? audioObjs : [audioObjs];

            if (me.fireEvent("beforeinsertaudio", audioObjs) === true) {
                return;
            }

            var html = [];
            for (var i = 0, vi, len = audioObjs.length; i < len; i++) {
                vi = audioObjs[i];
                html.push(
                    createAudioHtml(
                        vi.url,
                        {
                            cls: 'edui-audio-audio'
                        }
                    )
                );
            }
            me.execCommand("inserthtml", html.join(""), true);
            var rng = this.selection.getRange();
            // for (var i = 0, len = audioObjs.length; i < len; i++) {
            //   var img = this.document.getElementById("tmpAudio" + i);
            //   domUtils.removeAttributes(img, "id");
            //   rng.selectNode(img).select();
            //   me.execCommand("imagefloat", audioObjs[i].align);
            // }

            me.fireEvent("afterinsertaudio", audioObjs);
        },
        queryCommandState: function () {
            var img = me.selection.getRange().getClosedNode(),
                flag = img &&
                    (img.className == "edui-audio-audio" || img.className.indexOf("edui-audio-audio") != -1);
            return flag ? 1 : 0;
        }
    };
};
