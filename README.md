# UEditor Plus

基于 UEditor 二次开发的富文本编辑器，让UEditor重新焕发活力

![UEditor Plus](https://ms-assets.modstart.com/demo/UEditorPlus_v2.1.0.jpeg)

> `/dist/` 和 `/dist-min/` 目录分别为构建的非压缩和压缩版代码，可直接使用

## 功能亮点

- 全新的UI外观，使用字体图标替换原有图片图标
- 移除过时、无用的插件支持，不断完善使用体验
- 图片、文件、视频上传配置化定制增强
- 演示界面重构，右上角可直接查看当前演示界面代码
- 兼容现有UEditor，实现无缝切换

## 相关链接

- 在线演示：[https://open-demo.modstart.com/ueditor-plus/_examples/](https://open-demo.modstart.com/ueditor-plus/_examples/)
- 使用文档： [https://open-doc.modstart.com/ueditor-plus](https://open-doc.modstart.com/ueditor-plus)

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

### vue双向绑定

① 安装UEditor插件支持

```shell
npm i vue-ueditor-wrap
# 或
yarn add vue-ueditor-wrap
```

② 解压 UEditorPlus 到静态资源目录，配置

```html
<template>
    <div class="content">
        <vue-ueditor-wrap v-model="content"
                          editor-id="editor"
                          :config="editorConfig"
                          :editorDependencies="['ueditor.config.js','ueditor.all.js']"
                          style="height:500px;"/>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                content: '<p>Hello UEditorPlus</p>',
                editorConfig: {
                    // 编辑器后端服务接口，参考后端规范 https://open-doc.modstart.com/ueditor-plus/backend.html
                    serverUrl: '后端服务'
                    // 配置 UEditorPlus 的静态资源根路径，可以是 CDN 的静态资源地址
                    UEDITOR_HOME_URL: '/static/UEditorPlus'
                }
            }
        }
    }
</script>
```

更多配置和使用参考：[vue-ueditor-wrap](https://hc199421.gitee.io/vue-ueditor-wrap)

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

## TodoList

### 功能特性

- [ ] 颜色选择器支持自定义颜色 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5TXW7)
- [ ] 音频上传功能 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5TFI7)
- [ ] 多图上传压缩功能 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5KUNC)

### 体验优化

- [ ] 编辑器焦点在图片上时，光标不能移动问题

## 更新日志

- [https://open-doc.modstart.com/ueditor-plus/change-log.html](https://open-doc.modstart.com/ueditor-plus/change-log.html)

## 好项目推荐

- 快速开发框架 [ModStart](https://modstart.com)
- 企业内容建站系统 [ModStartCMS](https://modstart.com)
- 现代化个人博客系统 [ModStartBlog](https://modstart.com)

## 开源协议

- Apache 2.0
