"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
var aiConfig = editor.getOpt('ai');
var aiFunctions = editor.getOpt('aiFunctions');
var isMultiLine = function isMultiLine(text) {
  return text.indexOf('\n') !== -1;
};
var fetchStream = function fetchStream(url, option, onStream, onFinish) {
  fetch(url, Object.assign({
    method: 'POST'
  }, option)).then(function (response) {
    if (!response.ok) {
      onFinish({
        code: -1,
        msg: "HTTP error! status: ".concat(response.status)
      });
      return;
    }
    var reader = response.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buffer = '';
    var textList = [];
    function processChunk(chunk) {
      buffer += decoder.decode(chunk, {
        stream: true
      });
      // 分割事件流，每个事件以"data:"开头，以两个换行符结束
      var lines = buffer.split('\n');
      var _iterator = _createForOfIteratorHelper(lines),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var line = _step.value;
          line = line.trim();
          if (line.startsWith('data:')) {
            var jsonStr = line.replace('data:', '').trim();
            if (jsonStr === '[DONE]') {
              onFinish({
                code: 0,
                msg: 'ok',
                data: {
                  text: textList.join('')
                }
              });
              return;
            }
            try {
              var text = null;
              var data = JSON.parse(jsonStr);
              if (data.choices && data.choices.length > 0 && data.choices[0].delta) {
                text = data.choices[0].delta.content;
              } else if (data.type) {
                // 兼容ModStart
                // {"type":"error","data":"xxx"}
                // {"type":"end","data":"xxx"}
                // {"type":"data","data":"xxx"}
                if (data.type === 'error') {
                  onFinish({
                    code: -1,
                    msg: data.data
                  });
                  return;
                } else if (data.type === 'end') {
                  onFinish({
                    code: 0,
                    msg: 'ok',
                    data: {
                      text: textList.join('')
                    }
                  });
                  return;
                } else if (data.type === 'data') {
                  text = data.data;
                }
              }
              if (text !== null) {
                textList.push(text);
                onStream({
                  code: 0,
                  msg: 'ok',
                  data: {
                    text: text
                  }
                });
              } else {
                onFinish({
                  code: -1,
                  msg: 'No text found!'
                });
                console.log('data:', data);
              }
            } catch (e) {
              onFinish({
                code: -1,
                msg: 'JSON parse error!' + e
              });
            }
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      buffer = lines.pop() || '';
    }
    function read() {
      reader.read().then(function (_ref) {
        var done = _ref.done,
          value = _ref.value;
        if (done) {
          if (buffer) processChunk(new Uint8Array());
          return;
        }
        processChunk(value);
        read();
      })["catch"](function (error) {
        onFinish({
          code: -1,
          msg: 'Stream error!' + error
        });
      });
    }
    read();
  })["catch"](function (error) {
    onFinish({
      code: -1,
      msg: 'Request error!' + error
    });
  });
};
var openAiCompletion = function openAiCompletion(url, param, option) {
  option = Object.assign({
    body: null
  }, option);
  if (!option.body) {
    option.body = {
      model: aiConfig.driverConfig.model,
      messages: [{
        role: 'system',
        content: param.systemPromptText
      }, {
        role: 'user',
        content: param.promptText
      }],
      stream: true
    };
  }
  fetchStream(url, {
    headers: {
      'Authorization': "Bearer ".concat(aiConfig.driverConfig.key),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(option.body)
  }, param.onStream, param.onFinish);
};
var drivers = {
  'ModStart': function ModStart(param) {
    openAiCompletion(aiConfig.driverConfig.url, param, {
      body: {
        systemPrompt: param.systemPromptText,
        prompt: param.promptText
      }
    });
  },
  'OpenAi': function OpenAi(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://api.openai.com/v1/chat/completions', param);
  },
  'DeepSeek': function DeepSeek(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://api.deepseek.com/v1/chat/completions', param);
  },
  'Anthropic': function Anthropic(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://api.anthropic.com/v1/messages', param);
  },
  'Google': function Google(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', param);
  },
  'Baidu': function Baidu(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions', param);
  },
  'Alibaba': function Alibaba(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', param);
  },
  'Tencent': function Tencent(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://hunyuan.tencentcloudapi.com/v1/chat/completions', param);
  },
  'Huawei': function Huawei(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://pangu.huaweicloud.com/v1/chat/completions', param);
  },
  'ByteDance': function ByteDance(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', param);
  },
  'Zhipu': function Zhipu(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://open.bigmodel.cn/api/paas/v4/chat/completions', param);
  },
  'Moonshot': function Moonshot(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://api.moonshot.cn/v1/chat/completions', param);
  },
  'iFlytek': function iFlytek(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://spark-api-open.xf-yun.com/v1/chat/completions', param);
  },
  'Volcengine': function Volcengine(param) {
    openAiCompletion(aiConfig.driverConfig.url || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', param);
  }
};
function getRequest(driver) {
  if (aiConfig.driverRequest) {
    return aiConfig.driverRequest;
  }
  if (driver in drivers) {
    return drivers[driver];
  }
  return null;
}
var converter = new window.showdown.Converter();
var AiDefaultAiFunctionParam = {
  showInsert: true,
  showReplace: true,
  showReplaceAll: false
};
var Ai = {
  runtime: {
    range: null
  },
  init: function init() {
    new Vue({
      el: '#app',
      data: {
        loading: false,
        selectText: '',
        inputText: '',
        submitFunction: null,
        systemPromptText: '',
        promptText: '',
        resultText: '',
        resultError: '',
        functions: [],
        showInsert: AiDefaultAiFunctionParam.showInsert,
        showReplace: AiDefaultAiFunctionParam.showReplace,
        showReplaceAll: AiDefaultAiFunctionParam.showReplaceAll
      },
      mounted: function mounted() {
        Ai.runtime.range = editor.selection.getRange();
        var cloneContents = Ai.runtime.range.cloneContents();
        if (cloneContents) {
          this.selectText = cloneContents.textContent.trim();
        } else {
          this.selectText = '';
        }
        this.buildFunctions();
      },
      computed: {
        resultHtml: function resultHtml() {
          if (!this.resultText) {
            return '';
          }
          return converter.makeHtml(this.resultText);
        },
        resultHeight: function resultHeight() {
          var height = 255;
          if (this.selectText) {
            height -= 45;
          }
          if (this.resultError) {
            height -= 45;
          }
          return height + 'px';
        }
      },
      methods: {
        buildFunctions: function buildFunctions() {
          var enableParam = {
            selectText: this.selectText
          };
          this.functions = aiFunctions.map(function (f) {
            if (!f.enable(enableParam)) {
              return null;
            }
            f.prompt = f.prompt.replace(/\{selectText\}/g, enableParam.selectText);
            f.prompt = f.prompt.replace(/\{html\}/g, editor.getContent());
            f.param = Object.assign({}, AiDefaultAiFunctionParam, f.param);
            return f;
          }).filter(function (f) {
            return !!f;
          });
        },
        doSubmit: function doSubmit() {
          var _this = this;
          if (this.loading) {
            return;
          }
          if (!this.systemPromptText) {
            editor.tipError('请输入系统提示语');
            return;
          }
          this.loading = true;
          this.resultError = '';
          this.resultText = '';
          var driverRequest = getRequest(aiConfig.driver);
          if (!driverRequest) {
            editor.tipError('未找到驱动');
            return;
          }
          driverRequest({
            systemPromptText: this.systemPromptText,
            promptText: this.promptText,
            onStream: function onStream(res) {
              if (res.code) {
                _this.resultError = res.msg;
                return;
              }
              _this.resultText += res.data.text;
            },
            onFinish: function onFinish(res) {
              _this.loading = false;
              if (res.code) {
                _this.resultError = res.msg;
                return;
              }
              _this.resultText = res.data.text;
            }
          });
        },
        doSubmitFunction: function doSubmitFunction(f) {
          this.submitFunction = f;
          this.systemPromptText = f.systemPrompt || '';
          this.promptText = f.prompt || '';
          this.showInsert = f.param.showInsert;
          this.showReplace = f.param.showReplace;
          this.showReplaceAll = f.param.showReplaceAll;
          this.doSubmit();
        },
        doSubmitDirect: function doSubmitDirect() {
          this.submitFunction = null;
          this.systemPromptText = this.inputText || '';
          if (!this.systemPromptText) {
            editor.tipError('请输入系统提示语');
            return;
          }
          this.showInsert = AiDefaultAiFunctionParam.showInsert;
          this.showReplace = AiDefaultAiFunctionParam.showReplace;
          this.showReplaceAll = AiDefaultAiFunctionParam.showReplaceAll;
          this.doSubmit();
        },
        doInsert: function doInsert() {
          editor.fireEvent('saveScene');
          if (this.selectText) {
            if (isMultiLine(this.resultText)) {
              Ai.runtime.range.insertNode(document.createRange().createContextualFragment(this.resultHtml));
            } else {
              Ai.runtime.range.insertNode(document.createTextNode(this.resultText));
            }
          } else {
            if (isMultiLine(this.resultText)) {
              editor.execCommand('insertHtml', this.resultHtml);
            } else {
              editor.execCommand('insertHtml', this.resultText);
            }
          }
          dialog.close(true);
        },
        doReplace: function doReplace() {
          editor.fireEvent('saveScene');
          Ai.runtime.range.deleteContents();
          if (isMultiLine(this.resultText)) {
            Ai.runtime.range.insertNode(document.createRange().createContextualFragment(this.resultHtml));
          } else {
            Ai.runtime.range.insertNode(document.createTextNode(this.resultText));
          }
          dialog.close(true);
        },
        doReplaceAll: function doReplaceAll() {
          editor.fireEvent('saveScene');
          editor.setContent(this.resultText);
          dialog.close(true);
        }
      }
    });
  }
};
utils.domReady(function () {
  Ai.init();
});
