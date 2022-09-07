function preg_quote(str, delimiter) {
  // Quote regular expression characters plus an optional character
  //
  // version: 1107.2516
  // discuss at: http://phpjs.org/functions/preg_quote
  // +   original by: booeyOH
  // +   improved by: Ates Goral (http://magnetiq.com)
  // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   bugfixed by: Onno Marsman
  // +   improved by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: preg_quote("$40");
  // *     returns 1: '\$40'
  // *     example 2: preg_quote("*RRRING* Hello?");
  // *     returns 2: '\*RRRING\* Hello\?'
  // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
  // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
  return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

var Formula = {
  init: function () {
    // console.log('Formula.init')
    Formula.initValue();
    Formula.initEvent();
    Formula.initSubmit();
  },
  render: function () {
    var content = $.trim($('#editor').val());
    if (!content) {
      $('#preview').hide();
      return;
    }
    content = encodeURIComponent(content);
    var formulaConfig = editor.getOpt('formulaConfig');
    var src = formulaConfig.imageUrlTemplate.replace(/\{\}/, content);
    $('#previewImage').attr('src', src);
    $('#preview').show();
  },
  initValue: function () {
    var img = editor.selection.getRange().getClosedNode();
    if (img && img.getAttribute('data-formula-image') !== null) {
      var value = img.getAttribute('data-formula-image');
      if (value) {
        $('#editor').val(decodeURIComponent(value));
        Formula.render();
      }
    }
  },
  initEvent: function () {
    var changeTimer = null;
    // console.log('Formula.initEvent');
    $('#editor').on('change keypress', function () {
      changeTimer && clearTimeout(changeTimer);
      changeTimer = setTimeout(function () {
        Formula.render();
      }, 1000);
    });
    $('#inputDemo').on('click', function () {
      $('#editor').val('f(a) = \\frac{1}{2\\pi i} \\oint\\frac{f(z)}{z-a}dz');
      Formula.render();
    });
  },
  initSubmit: function () {
    dialog.onok = function () {
      editor.execCommand('formula', $.trim($('#editor').val()));
      editor.fireEvent('saveScene');
    };
    dialog.oncancel = function () {
    };
  }
};
