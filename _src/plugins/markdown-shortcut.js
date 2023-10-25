UE.plugins["markdown-shortcut"] = function () {

    if (!UE.browser.chrome) {
        return;
    }

    const me = this;

    const getCleanHtml = function (node) {
        let html = node.innerHTML
        html = html.replace(/[\u200b]*/g, '')
        return html
    }

    let shortCuts = [];
    // 注册 H1-H6 快捷键
    for (let i = 1; i <= 6; i++) {
        const regExp = new RegExp('^\\t?' + Array(i + 1).join('#') + '(\\s|&nbsp;)');
        (function (command) {
            shortCuts.push({
                name: 'Head' + i,
                tagName: ['P'],
                key: [' '],
                offset: [i + 1, i + 2],
                match: [regExp],
                callback: function (param) {
                    me.__hasEnterExecCommand = true;
                    me.execCommand('paragraph', command);
                    let range = me.selection.getRange();
                    let node = range.startContainer;
                    let html = getCleanHtml(node)
                    html = html.replace(regExp, '');
                    if (!html) {
                        html = domUtils.fillChar;
                    }
                    node.innerHTML = html;
                    me.__hasEnterExecCommand = false;
                }
            })
        })('h' + i);
    }

    me.on("ready", function () {

        domUtils.on(me.body, 'keyup', function (e) {
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
                    // console.log('keyup', [html, m, match, s.name]);
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
