prepare:
	cnpm install

build:
	rm -rfv ./dist/; \
	rm -rfv ./dist-min/; \
	grunt default --force; \
	node ./scripts/postBuild.js; \
	uglifyjs -o dist-min/ueditor.all.js dist/ueditor.all.js; \
	npx babel dist/dialogs/ai/ai.js -o dist/dialogs/ai/ai.js; \
	uglifyjs -o dist-min/dialogs/ai/ai.js dist/dialogs/ai/ai.js;

publish_to_open: build
	rm -rfv ../open.demo.soft.host/public/ueditor-plus
	export IS_MODSTART=1 && cd doc && npm run build && cd ..
	cp -av doc/docs/.vuepress/dist ../open.demo.soft.host/public/ueditor-plus
	cp -av _* ../open.demo.soft.host/public/ueditor-plus
	cp -av dialogs ../open.demo.soft.host/public/ueditor-plus/dialogs
	cp -av lang ../open.demo.soft.host/public/ueditor-plus/lang
	cp -av scripts ../open.demo.soft.host/public/ueditor-plus/scripts
	cp -av themes ../open.demo.soft.host/public/ueditor-plus/themes
	cp -av dist-min ../open.demo.soft.host/public/ueditor-plus/dist-min
	cp -av third-party ../open.demo.soft.host/public/ueditor-plus/third-party
	cp -av ueditor* ../open.demo.soft.host/public/ueditor-plus/

build_for_modstart: build
	rm -rfv     ../../vendor/modstart/modstart/asset/vendor/ueditor/; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/; \
	cp -av dist ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/index.html; \
	rm -rfv     ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/ueditor.parse.js; \
	mv ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.css ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less; \
	echo '@import "./../../../sui/bricks/component/html/html"; ' >> ../../vendor/modstart/modstart/resources/asset/src/vendor/ueditor/themes/iframe.less; \
	echo "SUCCESS"

