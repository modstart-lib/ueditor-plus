const fs = require('fs');
const path = require('path');
const md5File = require('md5-file');

const timestamp = parseInt((new Date().getTime()) / 1000);

// replace js,html,css file content {timestamp} to current timestamp in dist/ and dist-min/
function replacePlaceholderFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    content = content.replace(/['"]([^'"]+)\?\{timestamp:?.*?\}['"]/g,
        function (match, contents, offset, input_string) {
            let fileTimestampPath = path.join(path.dirname(filePath), contents);
            if (fileTimestampPath.indexOf('/~/') >= 0) {
                fileTimestampPath = fileTimestampPath.replace('/~/', '/');
            }
            if (!fs.existsSync(fileTimestampPath)) {
                const mat = /{timestamp:(.*?)\}/.exec(match);
                if (mat) {
                    fileTimestampPath = mat[1];
                }
            }
            if (!fs.existsSync(fileTimestampPath)) {
                console.log('not exists', fileTimestampPath, match);
                return match;
            }
            let timestamp = md5File.sync(fileTimestampPath).substr(0, 8);
            changed = true;
            contents = match.replace(/\{timestamp:?.*?\}/g, timestamp);
            console.log('replace', match, fileTimestampPath, timestamp);
            return contents;
        });
    if (changed) {
        console.log('update', filePath)
        fs.writeFileSync(filePath, content);
    }
}

function replacePlaceholderInDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = dir + file;
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            replacePlaceholderFile(filePath);
        } else if (stat.isDirectory()) {
            replacePlaceholderInDir(filePath + '/');
        }
    });
}

function replacePlaceholder(dirs) {
    dirs.forEach(dir => {
        replacePlaceholderInDir(dir);
    });
}

replacePlaceholder([
    'dist/',
    'dist-min/',
]);
