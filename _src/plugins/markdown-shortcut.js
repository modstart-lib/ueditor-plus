UE.plugins["markdown-shortcut"] = function () {

  var me = this;
  const uiUtils = UE.ui.uiUtils;

  const getCleanHtml = function (node) {
    var html = node.innerHTML
    html = html.replace(/[\u200b]*/g, '')
    return html
  }

  var shortCuts = [];
  for (var i = 1; i <= 6; i++) {
    var command = 'h' + i;
    const regExp = new RegExp('^\\t?' + Array(i + 1).join('#') + '(\\s|&nbsp;)');
    shortCuts.push({
      tagName: ['P'],
      key: [' '],
      offset: [i + 1, i + 2],
      match: [regExp],
      callback: function (param) {
        me.__hasEnterExecCommand = true;
        me.execCommand('paragraph', command);
        setTimeout(function () {
          var range = me.selection.getRange();
          var node = range.startContainer;
          // safari 下不会自动选中Hx标签
          if (node.tagName !== 'H' + i) {
            node = node.parentNode
          }
          var html = getCleanHtml(node)
          html = html.replace(regExp, '');
          if (!html) {
            html = domUtils.fillChar;
          }
          node.innerHTML = html;
          me.__hasEnterExecCommand = false;
        }, 0);
      }
    })
  }

  me.on("ready", function () {

    // var quickOperate = null
    // domUtils.on(me.body, "mouseover", function (evt) {
    //   const node = evt.target
    //   const rect = node.getBoundingClientRect();
    //   const offset = uiUtils.getClientRect(node)
    //   offset.left = offset.left - 60
    //   console.log('mouseover', rect, node, offset);
    //   // var offset = uiUtils.getViewportOffsetByEvent(evt);
    //   if (quickOperate) {
    //     quickOperate.destroy();
    //   }
    //   quickOperate = new UE.ui.QuickOperate({
    //     // items: contextItems,
    //     className: "edui-quick-operate",
    //     editor: me
    //   });
    //   // console.log('quickOperate', quickOperate);
    //   quickOperate.render();
    //   quickOperate.showAt(offset);
    // });

    domUtils.on(me.body, "keyup", function (e) {
      var range = me.selection.getRange();
      if (range.endOffset !== range.startOffset) {
        return;
      }
      var key = e.key;
      var offset = range.startOffset;
      const node = range.startContainer.parentNode;
      var html = getCleanHtml(node);
      var tagName = node.tagName;
      // console.log('keyup', [node, range, tagName, key, offset, html]);
      for (var s of shortCuts) {
        if (!s.tagName.includes(tagName)) {
          continue;
        }
        if (!s.key.includes(key)) {
          continue;
        }
        if (!s.offset.includes(offset)) {
          continue;
        }
        for (var m of s.match) {
          let match = html.match(m);
          // console.log('keyup', [html, m, match]);
          if (match) {
            s.callback({
              node: node,
            });
            break;
          }
        }
      }
    });
  });

};
