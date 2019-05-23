const fs = require('fs')
const path = require('path')

function ensureFileExistence(filename) {
    fs.closeSync(fs.openSync(filename, 'a+'));
}

module.exports = ensureFileExistence