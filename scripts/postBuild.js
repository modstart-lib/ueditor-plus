const fs = require('fs');

// replace js,html,css file content {timestamp} to current timestamp in dist/ and dist-min/
function replacePlaceholder(dirs) {
    const timestamp = parseInt((new Date().getTime()) / 1000);
    dirs.forEach(dir => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = dir + file;
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
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
        });
    });
}

replacePlaceholder([
    'dist/',
    'dist-min/',
]);
