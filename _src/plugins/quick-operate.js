UE.plugins["quick-operate"] = function () {

    if (!UE.browser.chrome) {
        return;
    }
    return;

    let me = this;
    const uiUtils = UE.ui.uiUtils;

    me.on("ready", function () {
        let quickOperate = new UE.ui.QuickOperate({
            // items: contextItems,
            className: "edui-quick-operate",
            editor: me
        });
        quickOperate.render();

        let quickOperateNode = {
            root: null,
            target: null,
        }
        domUtils.on(quickOperate.el, 'mouseenter', function (evt) {
            quickOperateNode.root && quickOperateNode.root.classList && quickOperateNode.root.classList.add('edui-quick-operate-active');
        });
        domUtils.on(quickOperate.el, 'mouseleave', function (evt) {
            quickOperateNode.root && quickOperateNode.root.classList && quickOperateNode.root.classList.remove('edui-quick-operate-active');
        });
        domUtils.on(me.body, "mouseout", function (evt) {
            // quickOperate.hide();
        });
        domUtils.on(me.body, "mouseover", function (evt) {
            const node = evt.target
            let rootNode = node;
            for (; rootNode.parentNode && rootNode.parentNode.tagName !== 'BODY';) {
                rootNode = rootNode.parentNode;
            }
            quickOperateNode.root = rootNode
            quickOperateNode.target = node
            // me.body.querySelectorAll('& > *').forEach(item => {
            //   item.classList.remove('edui-quick-operate-active');
            // });
            // rootNode.classList.add('edui-quick-operate-active');
            const rect = node.getBoundingClientRect();
            const offset = uiUtils.getClientRect(node)
            offset.left = offset.left - 55
            // console.log('mouseover', rect, node, offset);
            // let offset = uiUtils.getViewportOffsetByEvent(evt);
            // console.log('quickOperate', quickOperate);
            quickOperate.showAt(offset);
        });

    });

};
