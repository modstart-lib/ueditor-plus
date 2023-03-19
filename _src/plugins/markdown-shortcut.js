UE.plugins["markdown-shortcut"] = function () {

  let me = this;

  let shortCuts = [];
  for (let i = 1; i <= 6; i++) {
    let command = 'h' + i;
    const regExp = new RegExp('^' + Array(i + 1).join('#') + '(\\s|&nbsp;)');
    shortCuts.push({
      tagName: ['P'],
      key: [' '],
      offset: [i + 1, i + 2],
      match: [regExp],
      callback: function (param) {
        me.execCommand('paragraph', command);
        setTimeout(function () {
          let range = me.selection.getRange();
          let node = range.startContainer;
          // firefox下不会自动选中Hx标签
          if (node.tagName !== 'H' + i) {
            node = node.parentNode
          }
          let value = node.innerHTML.replace(regExp, '');
          if (!value) {
            value = '<br />';
          }
          // console.log('xxxx', node.innerHTML, value);
          node.innerHTML = value;
        }, 0);
      }
    })
  }

  me.on("ready", function () {
    domUtils.on(me.body, "keyup", function (e) {
      let range = me.selection.getRange();
      if (range.endOffset !== range.startOffset) {
        return;
      }
      let key = e.key;
      let offset = range.startOffset;
      const node = range.startContainer.parentNode;
      let tagName = node.tagName;
      let text = range.startContainer.data;
      // console.log('keyup', node, range, tagName, key, offset, text);
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
          if (text.match(m)) {
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
