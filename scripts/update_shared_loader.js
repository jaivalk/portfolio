const fs = require('fs');
let js = fs.readFileSync('D:/Antigravity/jaival/shared.js', 'utf8');

if (!js.includes('DISABLE_GLOBAL_LOADER')) {
    js = js.replace(/function createGlobalLoader\(\) \{/, 'function createGlobalLoader() {\n    if (window.DISABLE_GLOBAL_LOADER) return;');
    fs.writeFileSync('D:/Antigravity/jaival/shared.js', js);
    console.log('Added DISABLE_GLOBAL_LOADER flag');
} else {
    console.log('Flag already present');
}
