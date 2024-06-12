import logo from './logo.svg';
import './App.css';
import RcUeditor from 'react-ueditor-wrap';

function App() {
    const hanldeChage = (value) => {
        console.log('RcUeditor', value);
    }
    return (
        <div className="App">
            <header>
                <img src={logo} className="App-logo" alt="logo"/>
            </header>
            <h2>
                UEditor Plus React 集成示例
            </h2>
            <div style={{margin: '0 auto', maxWidth: '800px'}}>
                <RcUeditor
                    value={'<p>Hello UEditorPlus</p>'}
                    ueditorUrl={'/static/UEditorPlus/ueditor.all.js'}
                    ueditorConfigUrl={'/static/UEditorPlus/ueditor.config.js'}
                    editorConfig={{
                        // 后端服务地址，后端处理参考
                        // https://open-doc.modstart.com/ueditor-plus/backend.html
                        initialFrameWidth: '100%',
                        serverUrl: '/api/path/to/server',
                        UEDITOR_HOME_URL: '/static/UEditorPlus/',
                        UEDITOR_CORS_URL: '/static/UEditorPlus/',
                    }}
                    onChange={hanldeChage}/>
            </div>
        </div>
    );
}

export default App;
