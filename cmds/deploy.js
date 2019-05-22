
const minimist = require('minimist')
const error = require('../utils/error')
const getPackage = require('../utils/package').get
var AWS = require('aws-sdk');
const fs = require('fs')
const path = require('path')
const defaultPolicy = require('../templates/public_permissions.json')


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
    options.cf_envs = options.cf_envs || []

    let action = args._[1]

    let bucket = await checkS3forBucket(options,1)
    console.log('bucket', bucket)
    if(!bucket){
        await createBucket(options,1)
        await putBucketWebsite(options,1)
    }
    sendToBucket(options)
    

    
// ## Get a list of buckets with this name
// echo "Checking for AWS bucket s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}"
// S3_CHECK=$(aws s3 ls "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile ${AWS_PROFILE} 2>&1)


// ## If the check did not exit successfully
// if [ $? != 0 ]; then
//     ## If it didn't find the bucket
//     NO_BUCKET_CHECK=$(echo $S3_CHECK | grep -c 'NoSuchBucket') 
//     if [ $NO_BUCKET_CHECK = 1 ]; then
//         ## Bucket does not exist - lets create it
//         echo "Bucket does not exist"
//         aws s3api create-bucket --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile $AWS_PROFILE
//     ## Else it returned a different error
//     else
//         echo "Error checking S3 Bucket"
//         echo "$S3_CHECK"
//         exit 1
//     fi 
// ## Else it found the bucket
// else
//     echo "Bucket exists"
// fi

// ## Configure the bucket's access and policy
// aws s3api put-bucket-acl --profile ${AWS_PROFILE} --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --acl public-read
// POLICY=$(cat ./deploy/public_permissions.json) && \
// NEW_POLICY=${POLICY/bucket/"${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}"} && \
// aws s3api put-bucket-policy --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --policy "${NEW_POLICY}" --profile $AWS_PROFILE

// ## Configure the bucket as a website
// aws s3 website "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --index-document index.html --error-document index.html --profile $AWS_PROFILE

// ## Wipe the cotents of the bucket
// aws s3 rm "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --recursive --profile $AWS_PROFILE

// ## Upload the contents of the build folder
// aws s3 sync build/ "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile $AWS_PROFILE


}

async function checkS3forBucket(options,exit){
    checkProps(['profile', 'env','domain'],options)
    let {profile, env, domain} = options
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var s3 = new AWS.S3();
    let promise = s3.listBuckets({}).promise()
    console.log(env, domain)
    return promise.then(
        function(data) {
            // console.log(data)
            /* process the data */
            let list = data.Buckets
            let match = false
            list.forEach(item=>{
                let fullDomain = `${env}-${domain}`
                if(item && item.Name && item.Name === fullDomain){
                    match = item
                } 
            })
            if(!match) error(`No bucket found for environment: ${env}`,exit)
            // console.log(item)
            return match
        },
        function(err) {
            /* handle the error */
            console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
}


async function createBucket(options,exit){
    checkProps(['profile', 'env', 'domain'],options)
    let {profile, env, domain} = options
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var s3 = new AWS.S3();
    let promise = s3.createBucket({
        Bucket: `${env}-${domain}`,
        ACL: 'public-read',
        Policy: JSON.stringify(defaultPolicy)
    }).promise()
    // console.log(env, domain)
    return promise.then(
        function(data) {
            console.log('createBucket', data)
            /* process the data */
        },
        function(err) {
            /* handle the error */
            // console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
}

async function putBucketWebsite(options,exit){
    checkProps(['profile', 'env' ,'domain'],options)
    let {profile, env, domain} = options
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var s3 = new AWS.S3();
    let promise = s3.createBucket({
        Bucket: `${env}-${domain}`,
        ContentMD5: "", 
        WebsiteConfiguration: {
         ErrorDocument: {
          Key: "error.html"
         }, 
         IndexDocument: {
          Suffix: "index.html"
         }
        }
    }).promise()
    // console.log(env, domain)
    return promise.then(
        function(data) {
            console.log('websiteBucket', data)
            /* process the data */
        },
        function(err) {
            /* handle the error */
            // console.log(err, err.stack); 
            error(JSON.stringify(err,err.stack),exit)
        }
    ).catch(err=>error(JSON.stringify(err,err.stack),exit))
}



async function sendToBucket(options={},exit=0){
    checkProps(['profile', 'env', 'domain'],options)
    let {profile, env, domain} = options
    var credentials = new AWS.SharedIniFileCredentials({profile});
    AWS.config.credentials = credentials;
    var awsS3 = new AWS.S3();
    var s3 = require('s3-client');
    var options = {s3Client: awsS3};    
    var client = s3.createClient({
      s3Client: awsS3
    });

    var params = {
        localDir: options.directory || `./.stackpack/builds/${env}`,
        deleteRemoved: true, // default false, whether to remove s3 objects
                             // that have no corresponding local file.
        s3Params: {
          Bucket: `${env}-${domain}`,
        }
      };
    var uploader = client.uploadDir(params);
    uploader.on('error', function(err) {
        console.error("unable to sync:", err.stack);
    });
    uploader.on('progress', function() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0); 
        process.stdout.write(`progress ${uploader.progressAmount}, ${uploader.progressTotal}`);
    });
    uploader.on('end', function() {
        console.log("\ndone uploading");
    });
}
