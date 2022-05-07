# UEditor Plus

基于 UEditor 二次开发的富文本编辑器，让UEditor重新焕发活力

![UEditor Plus](https://ms-assets.modstart.com/demo/UEditorPlus.jpg)



## 功能亮点

- 全新的UI外观，使用字体图标替换原有图片图标
- 移除过时、无用的插件支持，不断完善使用体验
- 图片、文件、视频上传配置化定制增强
- 兼容现有UEditor，实现无缝切换



## 在线演示

- [https://open-demo.modstart.com/ueditor-plus/dist-min/](https://open-demo.modstart.com/ueditor-plus/dist-min/)


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

#### v2.1.0 开发中

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
