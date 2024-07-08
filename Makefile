prepare:
	cnpm install

build:
	rm -rfv ./dist/; \
	rm -rfv ./dist-min/; \
	grunt default --force; \
	node ./scripts/postBuild.js; \
	uglifyjs -o dist-min/ueditor.all.js dist/ueditor.all.js;

build_for_modstart: build
	rm -rfv     ../../vendor/modstart/modstart/asset/vendor/ueditor/; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/; \
	cp -av dist ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/index.html; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/ueditor.parse.js; \
	mv ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.css ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less; \
	echo '@import "./../../../sui/bricks/component/html/html"; ' >> ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less; \
	echo "SUCCESS"

