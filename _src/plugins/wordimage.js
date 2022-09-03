///import core
///commands 本地图片引导上传
///commandsName  WordImage
///commandsTitle  本地图片引导上传
///commandsDialog  dialogs\wordimage

UE.plugin.register("wordimage", function() {
  var me = this,
    images = [];

  this.addListener("click", function (type, evt) {
    var el = evt.target || evt.srcElement;
    if ('IMG' == el.tagName && el.getAttribute('data-word-image')) {
      me.ui._dialogs.wordimageDialog && me.ui._dialogs.wordimageDialog.open();
    }
  });

  return {
    commands: {
      wordimage: {
        execCommand: function() {
          var images = domUtils.getElementsByTagName(me.body, "img");
          var urlList = [];
          for (var i = 0, ci; (ci = images[i++]); ) {
            var url = ci.getAttribute("data-word-image");
            url && urlList.push(url);
          }
          return urlList;
        },
        queryCommandState: function() {
          images = domUtils.getElementsByTagName(me.body, "img");
          for (var i = 0, ci; (ci = images[i++]); ) {
            if (ci.getAttribute("data-word-image")) {
              return 1;
            }
          }
          return -1;
        },
        notNeedUndo: true
      }
    },
    inputRule: function(root) {
      utils.each(root.getNodesByTagName("img"), function(img) {
        var attrs = img.attrs,
          flag = parseInt(attrs.width) < 128 || parseInt(attrs.height) < 43,
          opt = me.options,
          src = opt.UEDITOR_HOME_URL + "themes/default/images/spacer.gif";
        if (attrs["src"] && /^(?:(file:\/+))/.test(attrs["src"])) {
          img.setAttr({
            width: attrs.width,
            height: attrs.height,
            alt: attrs.alt,
            'data-word-image': attrs.src,
            src: src,
            style:
              "background:url(" +
                (flag
                  ? opt.themePath + opt.theme + "/images/word.gif"
                  : opt.langPath + opt.lang + "/images/localimage.png") +
                ") no-repeat center center;border:1px solid #ddd"
          });
        }
      });
    }
  };
});
