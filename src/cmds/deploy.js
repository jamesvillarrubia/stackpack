/* eslint-disable global-require */
/* eslint-disable no-console */

const minimist = require('minimist');
const AWS = require('aws-sdk');
// const fs = require('fs');
// const path = require('path');
const getPackage = require('../utils/package').get;
const error = require('../utils/error');
const defaultPolicy = require('../templates/public_permissions.json');
// const ensureDirectoryExistence = require('../utils/dir-exists');


function checkProps(array, object) {
  array.forEach((a) => {
    // console.log(a, !object.hasOwnProperty(a));
    // eslint-disable-next-line no-prototype-builtins
    if (!object.hasOwnProperty(a)) {
      // console.log(object, a, !object.a);
      error(`Config or flags must include the ${a} property.`);
    }
  });
}


async function checkS3forBucket(options, exit) {
  checkProps(['profile', 'env', 'domain'], options);
  const { profile, env, domain } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const s3 = new AWS.S3();
  const promise = s3.listBuckets({}).promise();
  console.log(env, domain);
  return promise.then(
    (data) => {
      // console.log(data)
      /* process the data */
      const list = data.Buckets;
      let match = false;
      list.forEach((item) => {
        const fullDomain = `${env}-${domain}`;
        if (item && item.Name && item.Name === fullDomain) {
          match = item;
        }
      });
      if (!match) error(`No bucket found for environment: ${env}`, false);
      // console.log(match);
      return match;
    },
    (err) => {
      /* handle the error */
      console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}


async function createBucket(options, exit) {
  checkProps(['profile', 'env', 'domain'], options);
  const { profile, env, domain } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const s3 = new AWS.S3();

  const promise = s3.createBucket({
    Bucket: `${env}-${domain}`,
    ACL: 'public-read',
    // Policy: JSON.stringify(defaultPolicy)
  }).promise();
  defaultPolicy.Statement[0].Resource = [`arn:aws:s3:::${env}-${domain}/*`];

  return promise.then(
    (data) => {
      // console.log('createBucket', data);
      // console.log(defaultPolicy);
      const promise2 = s3.putBucketPolicy({
        Bucket: `${env}-${domain}`,
        Policy: JSON.stringify(defaultPolicy)
      }).promise();

      return promise2.then(
        (data2) => {
          // console.log('createBucketPolicy', data2);
        },
        (err) => {
          error(JSON.stringify(err, err.stack), exit);
        }
      );
    },
    (err) => {
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}

async function putBucketWebsite(options, exit) {
  checkProps(['profile', 'env', 'domain'], options);
  const { profile, env, domain } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const s3 = new AWS.S3();
  const promise = s3.putBucketWebsite({
    Bucket: `${env}-${domain}`,
    ContentMD5: '',
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: 'error.html'
      },
      IndexDocument: {
        Suffix: 'index.html'
      }
    }
  }).promise();
  // console.log(env, domain)
  return promise.then(
    (data) => {
      console.log('websiteBucket', data);
      /* process the data */
    },
    (err) => {
      /* handle the error */
      // console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}


async function sendToBucket(options = {}) {
  checkProps(['profile', 'env', 'domain'], options);
  const s3 = require('s3-client');
  const { profile, env, domain } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const awsS3 = new AWS.S3();
  const client = s3.createClient({
    s3Client: awsS3
  });

  const params = {
    localDir: options.directory || `./.stackpack/builds/${env}`,
    deleteRemoved: true, // default false, whether to remove s3 objects
    // that have no corresponding local file.
    s3Params: {
      Bucket: `${env}-${domain}`,
    }
  };
  // console.log(params);
  const uploader = client.uploadDir(params);
  uploader.on('error', (err) => {
    console.error('unable to sync:', err.stack);
  });
  uploader.on('progress', () => {
    if (process.stdout.isTTY) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`progress ${uploader.progressAmount}, ${uploader.progressTotal}`);
    }
  });
  uploader.on('end', () => {
    console.log('\ndone uploading');
  });
}


module.exports = async () => {
  const args = minimist(process.argv.slice(2));
  const { env, profile } = args;
  const options = getPackage().stackpack;
  options.env = env;
  options.profile = profile || options.profile || 'default';
  options.cf_envs = options.cf_envs || [];

  const bucket = await checkS3forBucket(options, 1);
  console.log('bucket', bucket);
  // // eslint-disable-next-line no-constant-condition
  if (!bucket) {
    await createBucket(options, 1);
    await putBucketWebsite(options, 1);
  // sendToBucket(options);
  }
  sendToBucket(options);
};
