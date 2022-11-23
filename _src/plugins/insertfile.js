/**
 * 插入附件
 */
UE.plugin.register("insertfile", function() {
  var me = this;

  function getFileIcon(url) {
    var ext = url.substr(url.lastIndexOf(".") + 1).toLowerCase(),
      maps = {
          "ai":"ai.svg",
          "ape":"ape.svg",
          "apk":"apk.svg",
          "zip":"zip.svg",
          "rar":"rar.svg",
          "ass":"ass.svg",
          "avi":"avi.svg",
          "bat":"bat.svg",
          "cad":"cad.svg",
          "cdr":"cdr.svg",
          "chm":"chm.svg",
          "code":"code.svg",
          "css":"css.svg",
          "dat":"dat.svg",
          "doc":"doc.svg",
          "dps":"dps.svg",
          "dwg":"dwg.svg",
          "et":"et.svg",
          "exe":"exe.svg",
          "f4v":"f4v.svg",
          "fhd":"fhd.svg",
          "fla":"fla.svg",
          "flv":"flv.svg",
          "gif":"gif.svg",
          "hd":"hd.svg",
          "html":"html.svg",
          "img":"img.svg",
          "ipa":"ipa.svg",
          "jpeg":"jpeg.svg",
          "jpg":"jpg.svg",
          "key":"key.svg",
          "log":"log.svg",
          "m2ts":"m2ts.svg",
          "mdf":"mdf.svg",
          "mkv":"mkv.svg",
          "mov":"mov.svg",
          "mp3":"mp3.svg",
          "mp4":"mp4.svg",
          "mpg":"mpg.svg",
          "mpp":"mpp.svg",
          "msi":"msi.svg",
          "mts":"mts.svg",
          "pdf":"pdf.svg",
          "pic":"pic.svg",
          "png":"png.svg",
          "ppt":"ppt.svg",
          "psd":"psd.svg",
          "raw":"raw.svg",
          "rm":"rm.svg",
          "rmvb":"rmvb.svg",
          "rp":"rp.svg",
          "rtf":"rtf.svg",
          "sd":"sd.svg",
          "sketch":"sketch.svg",
          "srt":"srt.svg",
          "ssa":"ssa.svg",
          "svg":"svg.svg",
          "swf":"swf.svg",
          "tif":"tif.svg",
          "torrent":"torrent.svg",
          "txt":"txt.svg",
          "unknown":"unknown.svg",
          "video":"video.svg",
          "wma":"wma.svg",
          "wmv":"wmv.svg",
          "wps":"wps.svg",
          "xls":"xls.svg",
          "xmind":"xmind.svg",
      };
    return maps[ext] ? maps[ext] : maps["unknown"];
  }

  return {
    commands: {
      insertfile: {
        execCommand: function(command, filelist) {
          filelist = utils.isArray(filelist) ? filelist : [filelist];

          if (me.fireEvent("beforeinsertfile", filelist) === true) {
            return;
          }


          console.log('themePath',  );
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
