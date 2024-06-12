<template>
    <div id="app">
        <img alt="Vue logo" src="./assets/logo.png">
        <div style="max-width:800px;margin:0 auto;">
            <h2>UEditor Plus Vue2 集成示例</h2>
            <div>
                <vue-ueditor-wrap v-model="content"
                                  editor-id="editor"
                                  :config="editorConfig"
                                  :editorDependencies="['ueditor.config.js','ueditor.all.js']"
                                  style="height:500px;"/>
            </div>
        </div>
    </div>
</template>

<script>
import VueUeditorWrap from 'vue-ueditor-wrap'

export default {
    name: 'App',
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

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
