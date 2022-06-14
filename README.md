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


## 使用说明

### 第一步，下载最新版本

- 国内：[https://gitee.com/modstart-lib/ueditor-plus](https://gitee.com/modstart-lib/ueditor-plus)
- 国外：[https://github.com/modstart-lib/ueditor-plus](https://github.com/modstart-lib/ueditor-plus)

### 第二步，打开浏览器

- 使用浏览器打开 `_examples/index.html` 查看


## 关于Bug反馈与维护

- 众所周知 UEditor 使用的人数多，目前已经累积了N个Bug，开源不易需要大家共同维护
- 对于在实际使用中遇到的问题，如果急需解决推荐使用 [悬赏Issue](https://gitee.com/modstart-lib/ueditor-plus/reward_issues/new) ，这样让更多有能力的开发者有共同维护的动力


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

## 变更日志

#### v2.2.0

- 新增：Dom 操作添加 _propertyDelete 属性，方便删除属性
- 新增：图片编辑宽高为空时自动清除图片宽度和高度
- 修复：编辑器只包含视频，提交到服务器端的内容为空
- 优化：移除 video parse 无用插件

#### v2.1.0 开发中

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



## 项目推荐

- [ModStart快速开发框架](https://modstart.com)



## 开源协议

- Apache 2.0
