/**
 * Created by JetBrains PhpStorm.
 * User: taoqili
 * Date: 12-1-30
 * Time: 下午12:50
 * To change this template use File | Settings | File Templates.
 */
var wordImage = {};
var g = $G, flashObj, flashContainer;

wordImage.init = function (opt, callbacks) {
  showLocalPath("fileUrl");
  createCopyButton("copyButton", "fileUrl");
  addUploadButtonListener();
  addOkListener();
};

function addUploadButtonListener() {
  g('saveFile').addEventListener('change', function () {
    if (this.files.length !== 1) {
      alert('请选择1个文件')
      return;
    }
    $('.image-tip').html('正在转存，请稍后...');
    var file = this.files[0];
    uploader.addFile(file);
    uploader.upload();
  });
}


function addOkListener() {
  dialog.onok = function () {
    //console.log('imageUrls',imageUrls);
    if (!imageUrls.length) return;
    var urlPrefix = editor.getOpt('imageUrlPrefix'),
      images = domUtils.getElementsByTagName(editor.document, "img");
    editor.fireEvent('saveScene');
    // console.log('images',images,imageUrls);
    for (var i = 0, img; img = images[i++];) {
      var src = img.getAttribute("data-word-image");
      if (!src) continue;
      for (var j = 0, url; url = imageUrls[j++];) {
        // console.log('url',src, url);
        if (src.indexOf(url.name.replace(" ", "")) != -1) {
          img.src = urlPrefix + url.url;
          img.setAttribute("_src", urlPrefix + url.url);  //同时修改"_src"属性
          img.setAttribute("title", url.title);
          domUtils.removeAttributes(img, ["data-word-image", "style", "width", "height"]);
          editor.fireEvent("selectionchange");
          break;
        }
      }
    }
    editor.fireEvent('saveScene');
    // hideFlash();
  };
  dialog.oncancel = function () {
    //hideFlash();
  };
}

function showLocalPath(id) {
  //单张编辑
  var img = editor.selection.getRange().getClosedNode();
  var images = editor.execCommand('wordimage');
  if (images.length == 1 || img && img.tagName == 'IMG') {
    g(id).value = images[0];
    return;
  }
  var path = images[0];
  var leftSlashIndex = path.lastIndexOf("/") || 0,  //不同版本的doc和浏览器都可能影响到这个符号，故直接判断两种
    rightSlashIndex = path.lastIndexOf("\\") || 0,
    separater = leftSlashIndex > rightSlashIndex ? "/" : "\\";

  path = path.substring(0, path.lastIndexOf(separater) + 1);
  g(id).value = path;
}

function createCopyButton(id, dataFrom) {
  var url = g(dataFrom).value;
  if (url.startsWith("file:////")) {
    url = url.substring(8);
  }
  g(id).setAttribute("data-clipboard-text", url);
  var clipboard = new Clipboard('[data-clipboard-text]')
  clipboard.on('success', function (e) {
    g('copyButton').innerHTML = '复制成功';
  });
}
