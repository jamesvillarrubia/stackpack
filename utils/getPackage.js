const fs = require('fs')
const path = require('path')


module.exports = () => {
    let pack = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    // console.log(package)
    return pack || {}
}