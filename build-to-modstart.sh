rm -rfv dist/
rm -rfv dist-min/
grunt default
rm -rfv ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/
rm -rfv ../../vendor/modstart/modstart/asset/vendor/ueditor/
cp -av dist ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor
rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/index.html
rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/ueditor.parse.js
mv ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.css ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less
echo '@import "./../../../sui/bricks/component/html/html"; ' >> ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less
