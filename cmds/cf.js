
const minimist = require('minimist')
const error = require('../utils/error')
const getPackage = require('../utils/getPackage')
var AWS = require('aws-sdk');
const fs = require('fs')
const path = require('path')
const defaultConfig = require('../templates/s3-cf-https_default-config.json')


function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

module.exports = () => {
    const args = minimist(process.argv.slice(2))
    // console.log('cf args', args)

    // check minimum fields
    // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
    // if(!args.hasOwnProperty('root')) error('Must include --root',1)
    if(!args._[1]) error('Must include action',1)
    if(args._[1] !== 'setup' && !args.hasOwnProperty('env')) error('Must include --env',1)

    console.log(args)
    let { env } = args
    let options = getPackage().stackpack
    // let template = config.template
    // let ssl = config.ssl
    options.env = env
    options.profile = options.aws_profile
    options.module = options.module_name
    options.root = options.aws_bucket_root
    options.cf_envs = options.cf_envs || []
    options.rootenv = options.root_env

    let action = args._[1]

    switch(action){
        case 'refresh':
            refreshLocalConfig(options)
            break;
        case 'setup':
            setup(options)
            break;
        case 'update':
            updateConfigFromLocal(options)
            break;
        case 'get':
            getConfigByDomain(options)
            break;
        case 'invalidate':
            invalidate(options)
            break;
        case 'create':
            createCloudfrontFromConfig(options)
            break;
        default:
            error("Invalid action for cloudfront",1)
    } 

}

async function setup({profile,root, ssl, cf_envs, root_env}){
    let configs = cf_envs.map(env=>{
        return refreshLocalConfig(profile, root, env)
        .then(config=>{
            if(!config.Id){
                return createCloudfrontFromConfig(profile, root, env, ssl, root_env)
                .then(config=>{
                    return Promise.resolve({[env]: config.Id})
                })
            }else{
                return Promise.resolve({[env]: config.Id})
            }
        })
    })
    return Promise.all(configs)
    .then(configs=>{
        console.log('Cloudfront Setup deploying...')
        console.log(configs)
        return configs
    })
   
}   

 
async function invalidate({profile,root, env, template},exit){
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var cloudfront = new AWS.CloudFront();

    let config = JSON.parse(fs.readFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, 'utf8'));
    
    let promise = cloudfront.createInvalidation({
        DistributionId:config.Id,
        InvalidationBatch:{
            CallerReference: (new Date).getTime().toString(), 
            Paths:{
                Quantity:1,
                Items:['/*']
            }
        }
    }).promise()
    return promise.then(
        function(data) {
            console.log(data)
            /* process the data */
        },
        function(err) {
            /* handle the error */
            // console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
   
}   




async function createCloudfrontFromConfig({profile, root, env, ssl, root_env, template}){
    ssl = ssl || null
    let rootenv = root_env || prod
    console.log(profile, root, env, ssl, root_env, template)
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var cloudfront = new AWS.CloudFront();

    // check default
    let newConfig = Object.assign({},defaultConfig)

    // env = `fake14${env}`
    // adjust default
    newConfig.CallerReference = `${env}-${root}`
    newConfig.Aliases.Items[0] = `${env}-${root}`
    if(env === rootenv) {
        newConfig.Aliases.Quantity = 2
        newConfig.Aliases.push(root)
    }
    newConfig.Origins.Items[0].Id = `S3-${env}-${root}`
    newConfig.Origins.Items[0].DomainName = `${env}-${root}.s3.amazonaws.com`,
    newConfig.DefaultCacheBehavior.TargetOriginId =`S3-${env}-${root}`
    if(ssl){
        newConfig.ViewerCertificate.Certificate = `${ssl}`
    }else{
        delete newConfig.ViewerCertificate
        delete newConfig.Aliases
    }

    // adjust default
    let promise = cloudfront.createDistribution({DistributionConfig:newConfig}).promise()

    let out = await promise.then(
        function(data) {
            // console.log(data)
            return data.Distribution
        },
        function(err) {
            /* handle the error */
            // console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),1)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),1))

    ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`)
    fs.writeFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, JSON.stringify(out)); 
    
    return out
}

async function refreshLocalConfig({profile,root,env}, exit){
    let out = await getConfigByDomain(profile,root,env).catch(err=>error(JSON.stringify(err,err.stack),exit))
    let id = out.Id
    // console.log(env, out)
    ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`)
    fs.writeFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, JSON.stringify(out)); 
    // console.log(out)
    return out
}

function getConfigByDomain({profile, root, env, template}, exit){
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var cloudfront = new AWS.CloudFront();
    let promise = cloudfront.listDistributions({}).promise()
    return promise.then(
        function(data) {
            // console.log(data)
            /* process the data */
            let list = data.DistributionList.Items
            let match = false
            list.forEach(item=>{
                // console.log(item)
                let fullDomain = `${env}-${root}`
                if(item && item.Aliases && item.Aliases.Items && item.Aliases.Items.includes(fullDomain)){
                    // console.log(item.Id)
                    match = item
                } 
            })
            if(!match) error(`No Config for environment: ${env}`,exit)
            // console.log(item)
            return match
        },
        function(err) {
            /* handle the error */
            // console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
}

async function updateConfigFromLocal({profile, root, env, template}){
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var cloudfront = new AWS.CloudFront();

    ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`)
    let newConfig = JSON.parse(fs.readFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, 'utf8'));
    let etag = await getConfigByDomain(profile, root, env)


    let promise = cloudfront.updateDistribution({DistributionConfig:newConfig, Id:newConfig.Id, IfMatch:etag}).promise()
    return promise.then(
        function(data) {
            /* process the data */
        //    console.log(data)
           return data
        },
        function(err) {
            /* handle the error */
            console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
}