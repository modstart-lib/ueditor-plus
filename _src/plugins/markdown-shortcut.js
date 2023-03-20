UE.plugins["markdown-shortcut"] = function () {

  let me = this;
  const uiUtils = UE.ui.uiUtils;

  const getCleanHtml = function (node) {
    let html = node.innerHTML
    html = html.replace(/[\u200b]*/g, '')
    return html
  }

  let shortCuts = [];
  for (let i = 1; i <= 6; i++) {
    let command = 'h' + i;
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
          let range = me.selection.getRange();
          let node = range.startContainer;
          // safari 下不会自动选中Hx标签
          if (node.tagName !== 'H' + i) {
            node = node.parentNode
          }
          let html = getCleanHtml(node)
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

    // let quickOperate = null
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
      let range = me.selection.getRange();
      if (range.endOffset !== range.startOffset) {
        return;
      }
      let key = e.key;
      let offset = range.startOffset;
      const node = range.startContainer.parentNode;
      let html = getCleanHtml(node);
      let tagName = node.tagName;
      // console.log('keyup', [node, range, tagName, key, offset, html]);
      for (let s of shortCuts) {
        if (!s.tagName.includes(tagName)) {
          continue;
        }
        if (!s.key.includes(key)) {
          continue;
        }
        if (!s.offset.includes(offset)) {
          continue;
        }
        for (let m of s.match) {
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
