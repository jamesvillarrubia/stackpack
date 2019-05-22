
const shell = require('shelljs');
const minimist = require('minimist')
const error = require('../utils/error')
const getPackage = require('../utils/package').get
var AWS = require('aws-sdk');
const fs = require('fs')
const path = require('path')

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function checkProps(array, object){
    array.forEach(a=>{
        if(!object.hasOwnProperty(a)){
            error(`Config or flags must include the ${a} property.`)
        }
    })
}


module.exports = async () => {
    const args = minimist(process.argv.slice(2))
    // console.log('cf args', args)

    // check minimum fields
    // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
    // if(!args.hasOwnProperty('root')) error('Must include --root',1)
    // if(!args._[1]) error('Must include action',1)

    // console.log(args)
    let { env } = args
    let options = getPackage().stackpack
    // let template = config.template
    // let ssl = config.ssl
    options.env = env
    console.log(env)

    let action = args._[1]

    ensureDirectoryExistence(`./.stackpack/builds/${env}/`)
    checkForEnv(options)
    shell.exec(`env-cmd ./.env.${options.env} ./node_modules/.bin/react-scripts build; rm -r ./.stackpack/builds/${env}; mv build ./.stackpack/builds/${env}/`)
    console.log(`\nBuild created in .stackpack/builds/${env}\n`)
}

function checkForEnv(){

}