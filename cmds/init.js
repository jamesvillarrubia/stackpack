
const minimist = require('minimist')
const error = require('../utils/error')
const getPackage = require('../utils/package').get
const savePackage = require('../utils/package').save
var AWS = require('aws-sdk');
const fs = require('fs')
const path = require('path')
const defaultConfig = require('../templates/s3-cf-https_default-config.json')




module.exports = () => {
    const args = minimist(process.argv.slice(2))
    let template = args._[1] || null
    setupOptions(template)
    setupScripts(template)
}


function setupOptions(template){
    let pack = getPackage()
    // console.log(pack)
    let options = pack.stackpack || {}
    template = template || options.template || null

    switch(template){
        case 's3-cf-https-gitlab':
        case 's3-cf-https':
            options = {
                "ssl": "arn:aws:acm:us-east-1:99999999999:certificate/xxxxxxx-xxxx-xxxxxx-xxxxxxxxxxx",
                "template": "s3-cf-https",
                "profile": "default",
                "domain": "www.example.com",
                "environments": [
                  "develop",
                  "qa",
                  "staging",
                  "prod"
                ],
                "cf_envs": [
                  "develop",
                  "qa",
                  "staging",
                  "prod"
                ],
                "rootenv": "prod",
                ...options,
            }
            break;
        default:
            break;
    }
    pack = savePackage({...pack,stackpack:options})
    return pack
    

}



function setupScripts(template){
    let pack = getPackage()
    // console.log(pack)
    let scripts = pack.scripts || {}
    let options = pack.stackpack || {}
    let envs = options.environments || []
    // console.log(envs)
    let cfs = options.cf_envs || []
    let branches = options.gitflow
    template = template || options.template || null

    maxlength = 0
    envs.forEach(env=>{
        if(maxlength < env.length) maxlength = env.length
    })
    let stackObjects = {} 
    switch(template){
        case 's3-cf-https':
            stackObjects["__DEPLOY___"]= "____________________________________________________________________________________________________________________________________________________________________________"
            envs.forEach((env,i)=>{
                let spaces = ("                    ").slice(0, 5 + maxlength-env.length)
                let cf = (cfs.includes(env))? `${spaces}stackpack cf invalidate --env ${env}`:''
                stackObjects[`deploy:${env}`] = `${spaces}stackpack build --env ${env};${spaces}stackpack deploy --env ${env};${cf}`;
            })
            break;
        case 'gitflow':
            stackObjects["____GIT____"]= "____________________________________________________________________________________________________________________________________________________________________________"
            stackObjects["git:develop"]= "                                         git checkout develop   && git add .                   && git commit --allow-empty                    && git push origin develop;"
            stackObjects["git:qa"]= "             stackpack shell git-tools stash; git checkout qa        && git merge develop --no-edit && git commit -m 'run-gitlab-ci' --allow-empty && git push origin qa;         git checkout develop && stackpack shell git-tools unstash;"
            stackObjects["git:staging"]= "        stackpack shell git-tools stash; git checkout staging   && git merge qa                                                               && git push origin staging;    git checkout develop && stackpack shell git-tools unstash;"
            stackObjects["git:prod"]= "           stackpack shell git-tools stash; git checkout master    && git merge staging --no-edit && stackpack shell version-prompt              && git push origin master;     git checkout develop && stackpack shell git-tools unstash;"
            break;
        default:
            break;
    }
    scripts = {
        ...stackObjects,
        ...scripts,
    }
    // console.log(scripts)
    pack = savePackage({...pack,scripts})
    return pack
    

}
