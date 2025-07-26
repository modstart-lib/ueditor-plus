var contentImport = {};
var g = $G;

contentImport.data = {
    result: null,
};
contentImport.init = function (opt, callbacks) {
    addUploadButtonListener();
    addOkListener();
};
function upload (blob) {
     /* 创建Ajax并提交 
        暂时采用同步方式
        异步的话，可以自行参考 ueditor.all.js 23031开始 进行修改
         */
     var xhr = new XMLHttpRequest()
     var fd = new FormData()

     var url =  editor.getOpt('imageUrlPrefix')
    var actionUrl = editor.getActionUrl(editor.getOpt('imageActionName'))
    var type = 'png'
    if (blob.type) {
        type = blob.type.substr('image/'.length)
    }
    fd.append('upfile', blob, blob.name || ('blob.' + type))
    fd.append('type', 'ajax')
    xhr.open('post', actionUrl, false)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')

    xhr.send(fd)
    if (xhr.status == 200) {
        var json = (new Function('return ' + xhr.responseText))()
        if (json.state == 'SUCCESS' && json.url) {
            return url + json.url
        } else {
            return blob
        }
    }

}
function processWord(file) {
    $('.file-tip').html('正在转换Word文件，请稍后...');
    $('.file-result').html('').hide();
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
        mammoth.convertToHtml({
            arrayBuffer: loadEvent.target.result
        }, {
            convertImage: mammoth.images.imgElement(function (image) {
                return image.readAsArrayBuffer().then(function (imageBuffer) {
                    // 创建blob URL而不是base64

                    const blob = new Blob([imageBuffer], { type: image.contentType })
                    const url = upload(blob)
                   //若是只要展示 直接blob形式就可以，采用下面这行
                    // const url = URL.createObjectURL(blob)

                    return {
                        src: url,
                        alt: '文档图片'
                    }
                })
            })
        })
            .then(function displayResult(result) {
                $('.file-tip').html('转换成功');
                contentImport.data.result = result.value;
                $('.file-result').html(result.value).show();
            }, function (error) {
                $('.file-tip').html('Word文件转换失败:' + error);
            });
    };
    reader.onerror = function (loadEvent) {
        $('.file-tip').html('Word文件转换失败:' + loadEvent);
    };
    reader.readAsArrayBuffer(file);
}

function processMarkdown( markdown ){
    var converter = new showdown.Converter();
    var html = converter.makeHtml(markdown);
    $('.file-tip').html('转换成功');
    contentImport.data.result = html;
    $('.file-result').html(html).show();
}

function processMarkdownFile(file) {
    $('.file-tip').html('正在转换Markdown文件，请稍后...');
    $('.file-result').html('').hide();
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
        processMarkdown( loadEvent.target.result );
    };
    reader.onerror = function (loadEvent) {
        $('.file-tip').html('Markdown文件转换失败:' + loadEvent);
    };
    reader.readAsText(file, "UTF-8");
}

function addUploadButtonListener() {
    g('contentImport').addEventListener('change', function () {
        const file = this.files[0];
        const fileName = file.name;
        const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        switch (fileExt) {
            case 'docx':
            case 'doc':
                processWord(file);
                break;
            case 'md':
                processMarkdownFile(file);
                break;
            default:
                $('.file-tip').html('不支持的文件格式:' + fileExt);
                break;
        }
    });
    g('fileInputConfirm').addEventListener('click', function () {
        processMarkdown( g('fileInputContent').value );
        $('.file-input').hide();
    });
}

function addOkListener() {
    dialog.onok = function () {
        if (!contentImport.data.result) {
            alert('请先上传文件识别内容');
            return false;
        }
        editor.fireEvent('saveScene');
        editor.execCommand("inserthtml", contentImport.data.result);
        editor.fireEvent('saveScene');
    };
    dialog.oncancel = function () {
    };
}
