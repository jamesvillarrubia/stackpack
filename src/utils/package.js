const fs = require('fs')
const path = require('path')

function save(pack){
    fs.writeFileSync('package.json', JSON.stringify(pack, null, 2), 'utf8')
    return pack
}

function get(){
    let pack = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pack || {}
}

module.exports = {
    get,
    save
}