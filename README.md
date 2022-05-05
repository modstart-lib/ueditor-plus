# UEditor Plus 让UEditor重新焕发活力



## 第一步：下载编辑器

**方式一：完整安装包 （推荐）**

* [UEditor.tar.xz](https://github.com/modstart-lib/ueditor/raw/gh-pages/neditor.tar.xz)

**方式二： npm安装**

`npm i @modstart-lib/ueditor -S`

**方式三：编译安装**

```shell
git clone https://github.com/modstart-lib/ueditor.git
npm install
npm run build
```

### 第二步：在浏览器打开 index.html ###

进入到目录 `dist` , 使用浏览器打开文件 `index.html` 。

如果看到了下面这样的编辑器，恭喜你，初次部署成功！



### 设置和读取编辑器的内容

通 getContent 和 setContent 方法可以设置和读取编辑器的内容

```javascript
var ue = UE.getContent();
ue.ready(function(){
    //设置编辑器的内容
    ue.setContent('hello');
    //获取html内容，返回: <p>hello</p>
    var html = ue.getContent();
    //获取纯文本内容，返回: hello
    var txt = ue.getContentTxt();
});
```

UEditor 的更多API请看[API 文档](http://ueditor.baidu.com/doc "ueditor API 文档")

##  下载地址

UEditor 码云： [http://gitee.com/modstart-lib/ueditor](http://gitee.com/modstart-lib/ueditor "UEditor github 地址")

UEditor github 地址：[http://github.com/modstart-lib/ueditor](http://github.com/modstart-lib/ueditor "UEditor github 地址")

## 相关链接

UEditor 官网：[http://ueditor.baidu.com](http://ueditor.baidu.com "ueditor 官网")

UEditor API 文档：[http://ueditor.baidu.com/doc](http://ueditor.baidu.com/doc "ueditor API 文档")

## 详细文档

UEditor 文档：[http://fex.baidu.com/ueditor/](http://fex.baidu.com/ueditor/)

## 变更日志

### 2.0.0

- 优化：优化界面样式
- 新增：setWidth方法，可设置编辑器宽度
- 新增：视频和图片上传参数（见 ueditor.config.js 配置文件）
- 新增：`toolbarCallback` 属性，可以自定义响应工具栏图标点击
- 移除：谷歌地图、图片搜索、音乐搜索、截屏

## 其他项目

- [ModStart快速开发框架](https://modstart.com)
