const fs = require('fs');

const timestamp = parseInt((new Date().getTime()) / 1000);

// replace js,html,css file content {timestamp} to current timestamp in dist/ and dist-min/
function replacePlaceholderFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    if (content.indexOf('{timestamp}') > -1) {
        content = content.replace(/{timestamp}/g, timestamp);
        console.log('replacePlaceholder {timestamp}', filePath);
        changed = true;
    }
    if (changed) {
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
