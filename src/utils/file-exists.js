const fs = require('fs');
// const path = require('path');

function ensureFileExistence(filename) {
  fs.closeSync(fs.openSync(filename, 'a+'));
  fs.chmodSync(filename, '755');
}

module.exports = ensureFileExistence;
