prepare:
	npm install

build:
	rm -rfv ./dist/; \
	rm -rfv ./dist-min/; \
	grunt default --force; \
	node ./scripts/postBuild.js; \
	uglifyjs -o dist-min/ueditor.all.js dist/ueditor.all.js; \
	npx babel dist/dialogs/ai/ai.js -o dist/dialogs/ai/ai.js; \
	uglifyjs -o dist-min/dialogs/ai/ai.js dist/dialogs/ai/ai.js;



