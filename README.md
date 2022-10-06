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

## 在线演示

- [https://open-demo.modstart.com/ueditor-plus/_examples/](https://open-demo.modstart.com/ueditor-plus/_examples/)

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
                    serverUrl: '后端服务'
                    // 配置UEditorPlus的惊天资源
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

- [ ] 草稿功能
- [ ] 颜色选择器支持自定义颜色 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5TXW7)
- [ ] 音频上传功能 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5TFI7)
- [ ] 多图上传压缩功能 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5KUNC)

### 体验优化

- [ ] 图片高度过高时操作浮窗显示问题 [issue](https://gitee.com/modstart-lib/ueditor-plus/issues/I5TXOX)
- [ ] 编辑器焦点在图片上时，光标不能移动问题

## 更新日志

#### v2.5.0 Latex公式编辑，源码样式优化

- 新增：公式编辑器功能，提供latex语法的公式编辑器
- 优化：Word图片转存标识调整为data-word-image
- 优化：富文本编辑器浮层弹出按钮显示逻辑和样式优化
- 优化：系统集成时源代码编辑行距问题优化
- 优化：仓库新增Makefile配置文件方便快速构建

#### v2.4.0 Word图片粘贴重构，功能样式优化

- 新增：Word粘贴内容图片转存wordimage功能重构
- 新增：引入第三方复制插件clipboard库
- 新增：转存图片新增默认点击事件弹出转存弹窗
- 优化：多图上传并发数调整为1保证上传顺序
- 优化：弹窗按钮样式错位显示优化
- 优化：Word图片本地转存占位图优化
- 优化：删除Flash相关无用过时组件

#### v2.3.0 图片抓取重构，多处样式优化

- 新增：自动抓取图片优化为串行抓取，避免批量接口超时问题
- 新增：自定义菜单按钮样式类 edui-toolbar-button-custom
- 移除：移除百度地图插件
- 优化：文件粘贴上传Loading样式美化，勾选和单选基础颜色调整
- 优化：颜色选择工具颜色条样式错位调整
- 优化：工具栏下拉采样样式优化，页面margin导致的下拉错位
- 优化：演示Demo中自定义标题下拉样式

#### v2.2.0 vue示例支持，图片尺寸设定异常修复

- 新增：Dom 操作添加 _propertyDelete 属性，方便删除属性
- 新增：图片编辑宽高为空时自动清除图片宽度和高度
- 新增：vue使用示例说明（需第三方库支持）
- 修复：编辑器只包含视频，提交到服务器端的内容为空
- 优化：移除 video parse 无用插件

#### v2.1.0 演示网站重构，浮动工具和表格双击优化

- 新增：新增`unsetFloating`方法，方便动态Editor浮动工具栏处理
- 优化：表格边框双击时间调整为200ms（解决拖拽延迟问题）
- 优化：重新整理Demo页面也代码
- 修复：右击菜单图标和工具栏菜单冲突问题

#### v2.0.0 让UEditor重新焕发活力

- 优化：优化界面样式，使用字体图标
- 新增：`setWidth`方法，可设置编辑器宽度
- 新增：视频和图片上传参数（见 ueditor.config.js 配置文件）
- 新增：`toolbarCallback` 属性，可以自定义响应工具栏图标点击
- 移除：谷歌地图、图片搜索、音乐搜索、截屏

## 好项目推荐

- 快速开发框架 [ModStart](https://modstart.com)
- 企业内容建站系统 [ModStartCMS](https://modstart.com)
- 现代化个人博客系统 [ModStartBlog](https://modstart.com)

## 开源协议

- Apache 2.0
