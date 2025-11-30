UE.plugins["letterspacing"] = function () {
  var me = this;
  me.setOpt({
    letterspacing: ["0", "0.25", "0.5", "1", "1.5", "2", "3", "4", "5"],
  });

  me.commands["letterspacing"] = {
    execCommand: function (cmdName, value) {
      this.execCommand("paragraph", "p", {
        style: "letter-spacing:" + (value == "0" ? "normal" : value + "em"),
      });
      return true;
    },
    queryCommandValue: function () {
      var pN = domUtils.filterNodeList(
        this.selection.getStartElementPath(),
        function (node) {
          return domUtils.isBlockElm(node);
        }
      );
      if (pN) {
        var value = domUtils.getComputedStyle(pN, "letter-spacing");
        return value == "normal" ? '0' : value.replace(/[^\d.]*/gi, "");
      }
    },
  };
};
