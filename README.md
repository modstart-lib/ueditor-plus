# UEditor Plus

基于 UEditor 二次开发的富文本编辑器，让UEditor重新焕发活力

![UEditor Plus](https://ms-assets.modstart.com/demo/UEditorPlus_v2.1.0.jpeg)

[![star](https://img.shields.io/github/stars/modstart-lib/ueditor-plus.svg)](https://github.com/modstart-lib/ueditor-plus)
[![star](https://gitee.com/modstart-lib/ueditor-plus/badge/star.svg)](https://gitee.com/modstart-lib/ueditor-plus)
[![star](https://gitcode.com/modstart-lib/ueditor-plus/star/badge.svg)](https://gitcode.com/modstart-lib/ueditor-plus)

> `/dist/` 和 `/dist-min/` 目录分别为构建的非压缩和压缩版代码，可直接使用

## 功能亮点

- 支持文档一键导入，支持Word文档（docx）、Markdown文档（md）文档
- 全新的UI外观，使用字体图标替换原有图片图标
- 移除过时、无用的插件支持，不断完善使用体验
- 图片、文件、视频上传配置化定制增强
- 演示界面重构，右上角可直接查看当前演示界面代码
- 兼容现有UEditor，实现无缝切换

## 相关链接

- 在线演示：[https://open-demo.modstart.com/ueditor-plus/_examples/](https://open-demo.modstart.com/ueditor-plus/_examples/)
- 使用文档： [https://open-doc.modstart.com/ueditor-plus](https://open-doc.modstart.com/ueditor-plus)

## 使用遇到问题

自开源以来，UEditor Plus 已经被大家广泛关注，也收到了很多反馈。

为提高问题解决的效率，在提交问题时，请大家自行搭建一个最小可复现的环境代码（`zip` 压缩包 或 `git` 仓库地址），不提供的问题或者 `issue` 将不予解决和解答。

## 使用教程

### 原生使用

```html

<script id="editor" type="text/plain" style="height:300px;"></script>
<script type="text/javascript" src="/path/to/UEditorPlus/ueditor.config.js"></script>
<script type="text/javascript" src="/path/to/UEditorPlus/ueditor.all.js"></script>
<script>
    var ue = UE.getEditor('editor', {
        // ... 更多配置
    });
</script>
```

### vue2 使用

① 安装插件支持

```shell
npm i --save vue-ueditor-wrap@2.x
# 或
yarn add --save vue-ueditor-wrap@2.x
```

② 解压 UEditorPlus 到静态资源目录

复制 `dist-min` 到项目 `public/static/UEditorPlus/` 目录

③ 引入组件并使用

```html

<template>
    <div>
        <vue-ueditor-wrap v-model="content"
                          editor-id="editor"
                          :config="editorConfig"
                          :editorDependencies="['ueditor.config.js','ueditor.all.js']"
                          style="height:500px;"/>
    </div>
</template>
<script>
    import VueUeditorWrap from 'vue-ueditor-wrap'

    export default {
        components: {
            VueUeditorWrap
        },
        data() {
            return {
                content: '<p>Hello UEditorPlus</p>',
                editorConfig: {
                    // 后端服务地址，后端处理参考
                    // https://open-doc.modstart.com/ueditor-plus/backend.html
                    serverUrl: '/api/path/to/server',
                    UEDITOR_HOME_URL: '/static/UEditorPlus/',
                    UEDITOR_CORS_URL: '/static/UEditorPlus/',
                }
            }
        }
    }
</script>
```

### vue3 使用

① 安装插件支持

```shell
npm i --save vue-ueditor-wrap@3.x
# 或
yarn add --save vue-ueditor-wrap@3.x
```

② 解压 UEditorPlus 到静态资源目录

复制 `dist-min` 到项目 `public/static/UEditorPlus/` 目录

③ 引入组件并使用

**main.js**

```javascript
import {createApp} from 'vue'
import App from './App.vue'
import VueUeditorWrap from 'vue-ueditor-wrap';

createApp(App).use(VueUeditorWrap).mount('#app')
```

**App.vue**

```html

<template>
    <div>
        <vue-ueditor-wrap v-model="content"
                          editor-id="editor"
                          :config="editorConfig"
                          :editorDependencies="['ueditor.config.js','ueditor.all.js']"
                          style="height:500px;"/>
    </div>
</template>

<script setup>
    import {ref} from 'vue';

    const content = ref('<p>Hello UEditorPlus</p>');
    const editorConfig = {
        // 后端服务地址，后端处理参考
        // https://open-doc.modstart.com/ueditor-plus/backend.html
        serverUrl: '/api/path/to/server',
        UEDITOR_HOME_URL: '/static/UEditorPlus/',
        UEDITOR_CORS_URL: '/static/UEditorPlus/',
    }
</script>
```

### react 使用

① 安装插件支持

```shell
npm i --save react-ueditor-wrap
# 或
yarn add --save react-ueditor-wrap
```

② 解压 UEditorPlus 到静态资源目录

复制 `dist-min` 到项目 `public/static/UEditorPlus/` 目录

③ 引入组件并使用

```jsx
import RcUeditor from 'react-ueditor-wrap';

function App() {
    const hanldeChage = (value) => {
        console.log('RcUeditor', value);
    }
    return (
        <div className="App">
            <div style={{margin: '0 auto', maxWidth: '800px'}}>
                <RcUeditor
                    value={'<p>Hello UEditorPlus</p>'}
                    ueditorUrl={'/static/UEditorPlus/ueditor.all.js'}
                    ueditorConfigUrl={'/static/UEditorPlus/ueditor.config.js'}
                    editorConfig={{
                        // 后端服务地址，后端处理参考
                        // https://open-doc.modstart.com/ueditor-plus/backend.html
                        initialFrameWidth: '100%',
                        serverUrl: '/api/path/to/server',
                        UEDITOR_HOME_URL: '/static/UEditorPlus/',
                        UEDITOR_CORS_URL: '/static/UEditorPlus/',
                    }}
                    onChange={hanldeChage}/>
            </div>
        </div>
    );
}

export default App;
```

## 关于Bug反馈与维护

- 众所周知 UEditor 使用的人数多，目前已经累积了N个Bug，开源不易需要大家共同维护
- 对于在实际使用中遇到的问题，如果急需解决推荐使用 [悬赏Issue](https://gitee.com/modstart-lib/ueditor-plus/reward_issues/new)，这样让更多有能力的开发者有共同维护的动力

## 使用交流

- QQ群：539492162
- 使用问题或者改进建议，欢迎进群交流

## 二次开发

### 第一步，clone代码到本地

```shell
git clone https://gitee.com/modstart-lib/ueditor-plus.git
```

### 第二步，开始功能开发

使用浏览器打开 `_examples/index.html` 页面相关内容，完成功能开发

### 第三步，打包

```shell
npm install
grunt default
```

## UEditor相关链接

- UEditor 官网：[http://ueditor.baidu.com](http://ueditor.baidu.com)
- UEditor API 文档：[http://ueditor.baidu.com/doc](http://ueditor.baidu.com/doc)
- UEditor 文档：[http://fex.baidu.com/ueditor/](http://fex.baidu.com/ueditor/)
- UEditor API 文档：[http://ueditor.baidu.com/doc](http://ueditor.baidu.com/doc)

## 更新日志

- [https://open-doc.modstart.com/ueditor-plus/change-log.html](https://open-doc.modstart.com/ueditor-plus/change-log.html)

## 好项目推荐

- 快速开发框架 [ModStart](https://modstart.com)
- 企业内容建站系统 [ModStartCMS](https://modstart.com)
- 现代化个人博客系统 [ModStartBlog](https://modstart.com)

## 开源协议

- Apache 2.0
