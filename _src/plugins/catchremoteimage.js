///import core
///commands 远程图片抓取
///commandsName  catchRemoteImage,catchremoteimageenable
///commandsTitle  远程图片抓取
/**
 * 远程图片抓取,当开启本插件时所有不符合本地域名的图片都将被抓取成为本地服务器上的图片
 */
UE.plugins["catchremoteimage"] = function () {
  var me = this,
    ajax = UE.ajax;

  /* 设置默认值 */
  if (me.options.catchRemoteImageEnable === false) {
    return;
  }
  me.setOpt({
    catchRemoteImageEnable: false
  });

  var catcherLocalDomain = me.getOpt("catcherLocalDomain"),
    catcherActionUrl = me.getActionUrl(me.getOpt("catcherActionName")),
    catcherUrlPrefix = me.getOpt("catcherUrlPrefix"),
    catcherFieldName = me.getOpt("catcherFieldName");

  me.addListener('serverConfigLoaded', function () {
    catcherLocalDomain = me.getOpt("catcherLocalDomain");
    catcherActionUrl = me.getActionUrl(me.getOpt("catcherActionName"));
    catcherUrlPrefix = me.getOpt("catcherUrlPrefix");
    catcherFieldName = me.getOpt("catcherFieldName");
  });

  me.addListener("afterpaste", function () {
    me.fireEvent("catchremoteimage");
  });

  var catchRemoteImageCatching = false;

  function sendApi(imgs, callbacks) {
    var params = utils.serializeParam(me.queryCommandValue("serverparam")) || "",
      url = utils.formatUrl(
        catcherActionUrl +
        (catcherActionUrl.indexOf("?") === -1 ? "?" : "&") +
        params
      ),
      isJsonp = utils.isCrossDomainUrl(url),
      opt = {
        method: "POST",
        dataType: isJsonp ? "jsonp" : "",
        timeout: 60000, //单位：毫秒，回调请求超时设置。目标用户如果网速不是很快的话此处建议设置一个较大的数值
        onsuccess: callbacks["success"],
        onerror: callbacks["error"]
      };
    opt[catcherFieldName] = imgs;
    ajax.request(url, opt);
  }

  function catchElement(type, ele, imageUrl) {
    sendApi([imageUrl], {
      //成功抓取
      success: function (r) {
        try {
          var info = r.state !== undefined
            ? r
            : eval("(" + r.responseText + ")");
        } catch (e) {
          return;
        }

        /* 获取源路径和新路径 */
        var oldSrc,
          newSrc,
          oldBgIMG,
          newBgIMG,
          list = info.list;
        var catchFailList = [];
        var catchSuccessList = [];
        var failIMG = me.options.themePath + me.options.theme + '/images/img-cracked.png';

        var cj = list[0];
        switch (type) {
          case 'image':
            oldSrc = ele.getAttribute("_src") || ele.src || "";
            if (cj.state === "SUCCESS") {
              newSrc = catcherUrlPrefix + cj.url;
              // 上传成功是删除uploading动画
              domUtils.removeClasses(ele, "loadingclass");
              domUtils.setAttributes(ele, {
                "src": newSrc,
                "_src": newSrc,
                "data-catch-result": "success"
              });
              catchSuccessList.push(ele);
            } else {
              // 替换成统一的失败图片
              domUtils.removeClasses(ele, "loadingclass");
              domUtils.setAttributes(ele, {
                "src": failIMG,
                "_src": failIMG,
                "data-catch-result": "fail" // 添加catch失败标记
              });
              catchFailList.push(ele);
            }
            break;
          case 'background':
            oldBgIMG = ele.getAttribute("data-background") || "";
            if (cj.state === "SUCCESS") {
              newBgIMG = catcherUrlPrefix + cj.url;
              ele.style.cssText = ele.style.cssText.replace(loadingIMG, newBgIMG);
              domUtils.removeAttributes(ele, "data-background");
              domUtils.setAttributes(ele, {
                "data-catch-result": "success"   // 添加catch成功标记
              });
              catchSuccessList.push(ele);
            } else {
              ele.style.cssText = ele.style.cssText.replace(loadingIMG, failIMG);
              domUtils.removeAttributes(ele, "data-background");
              domUtils.setAttributes(ele, {
                "data-catch-result": "fail"   // 添加catch失败标记
              });
              catchFailList.push(ele);
            }
            break;
        }
        // 监听事件添加成功抓取和抓取失败的dom列表参数
        me.fireEvent('catchremotesuccess', catchSuccessList, catchFailList);
        catchRemoteImageCatching = false;
        setTimeout(function () {
          me.fireEvent('catchremoteimage');
        }, 0);
      },
      //回调失败，本次请求超时
      error: function () {
        me.fireEvent('catchremoteerror');
        catchRemoteImageCatching = false;
        setTimeout(function () {
          me.fireEvent('catchremoteimage');
        }, 0);
      }
    });
  }

  function catchRemoteImage() {
    if (catchRemoteImageCatching) {
      return;
    }
    catchRemoteImageCatching = true;

    var loadingIMG = me.options.themePath + me.options.theme + '/images/spacer.gif',
      imgs = me.document.querySelectorAll('[style*="url"],img'),
      test = function (src, urls) {
        if (src.indexOf(location.host) !== -1 || /(^\.)|(^\/)/.test(src)) {
          return true;
        }
        if (urls) {
          for (var j = 0, url; (url = urls[j++]);) {
            if (src.indexOf(url) !== -1) {
              return true;
            }
          }
        }
        return false;
      };

    for (var i = 0, ci; (ci = imgs[i++]);) {
      if (ci.getAttribute("data-word-image") || ci.getAttribute('data-catch-result')) {
        continue;
      }
      if (ci.nodeName === "IMG") {
        var src = ci.getAttribute("_src") || ci.src || "";
        if (/^(https?|ftp):/i.test(src) && !test(src, catcherLocalDomain)) {
          catchElement('image', ci, src);
          domUtils.setAttributes(ci, {
            class: "loadingclass",
            _src: src,
            src: loadingIMG
          })
          return;
        }
      } else {
        var backgroundImageurl = ci.style.cssText.replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
        if (/^(https?|ftp):/i.test(backgroundImageurl) && !test(backgroundImageurl, catcherLocalDomain)) {
          catchElement('background', ci, backgroundImageurl);
          ci.style.cssText = ci.style.cssText.replace(backgroundImageurl, loadingIMG);
          domUtils.setAttributes(ci, {
            "data-background": backgroundImageurl
          })
          return;
        }
      }
    }

  };

  me.addListener("catchremoteimage", function () {
    catchRemoteImage();
  });
};
