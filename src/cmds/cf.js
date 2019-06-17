/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-shadow */
/* eslint-disable no-console */

const minimist = require('minimist');
const AWS = require('aws-sdk');
const fs = require('fs');
// const path = require('path');
const getPackage = require('../utils/package').get;
const error = require('../utils/error');
const defaultConfig = require('../templates/s3-cf-https_default-config.json');
const ensureDirectoryExistence = require('../utils/dir-exists');


function checkProps(array, object, funcName = '') {
  array.forEach((a) => {
    // eslint-disable-next-line no-prototype-builtins
    if (!object.hasOwnProperty(a)) {
      error(`${funcName} - Config or flags must include the ${a} property.`);
    }
  });
}


async function createCloudfrontFromConfig(options, env) {
  checkProps(['profile', 'domain', 'rootenv', 'template'], options, 'createCloudfrontFromConfig');
  if (!env) {
    error('createCloudfrontFromConfig must include an env', true);
  }
  let {
    ssl
  } = options;
  const {
    profile, rootenv, domain, template
  } = options;

  ssl = ssl || null;
  const root = rootenv || 'prod';
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const cloudfront = new AWS.CloudFront();

  // check default
  const newConfig = Object.assign({}, defaultConfig);

  // env = `fake14${env}`
  // adjust default
  newConfig.CallerReference = `${env}-${domain}`;
  newConfig.Aliases.Items[0] = `${env}-${domain}`;
  if (env === rootenv) {
    newConfig.Aliases.Quantity = 2;
    newConfig.Aliases.Items.push(domain);
  }
  newConfig.Origins.Items[0].Id = `S3-${env}-${domain}`;
  newConfig.Origins.Items[0].DomainName = (`${env}-${domain}.s3.amazonaws.com`);
  newConfig.DefaultCacheBehavior.TargetOriginId = `S3-${env}-${domain}`;
  if (ssl) {
    newConfig.ViewerCertificate.Certificate = `${ssl}`;
  } else {
    delete newConfig.ViewerCertificate;
    delete newConfig.Aliases;
  }

  // adjust default
  const out = await cloudfront.createDistribution({ DistributionConfig: newConfig }).promise().then(
    (data) => {
      console.log(`    Distribution rolling for ${env}-${domain}`);
      return data.Distribution;
    },
    (err) => {
      /* handle the error */
      // console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), 1);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), 1));

  ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`);
  fs.writeFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, JSON.stringify(out));

  return out;
}


async function invalidate(options, exit) {
  checkProps(['profile', 'env', 'template'], options, 'invalidate');
  const { profile, env, template } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const cloudfront = new AWS.CloudFront();

  const config = JSON.parse(fs.readFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, 'utf8'));

  const promise = cloudfront.createInvalidation({
    DistributionId: config.Id,
    InvalidationBatch: {
      CallerReference: (new Date()).getTime().toString(),
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  }).promise();
  return promise.then(
    (data) => {
      console.log('invalidating');
      return data;
    },
    (err) => {
      /* handle the error */
      console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}

function getConfigByDomain(options, exit) {
  checkProps(['profile', 'env'], options, 'getConfigByDomain');
  const { profile, env, domain } = options;
  // console.log(profile)
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const cloudfront = new AWS.CloudFront();
  const promise = cloudfront.listDistributions({}).promise();
  // console.log(env, domain)
  return promise.then(
    (data) => {
      // console.log(data)
      /* process the data */
      const list = data.DistributionList.Items;
      let match = false;
      list.forEach((item) => {
        // console.log(item)
        const fullDomain = `${env}-${domain}`;
        // console.log(item.Aliases.Items)
        if (item && item.Aliases && item.Aliases.Items && item.Aliases.Items.includes(fullDomain)) {
          // console.log(item.Id)
          match = item;
        }
      });
      if (!match) error(`No Config for environment: ${env}`, exit);
      // console.log(item)
      return match;
    },
    (err) => {
      /* handle the error */
      // console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}

async function refreshLocalConfig(options, exit) {
  checkProps(['ssl', 'rootenv', 'template'], options, 'refreshLocalConfig');
  console.log('\n\nRefreshing local Cloudfront configs...');
  let { env, cf_envs, template } = options;
  // console.log(cf_envs)
  if (env) { cf_envs = [env]; }
  // console.log(cf_envs);
  return Promise.all(cf_envs.map(async (env) => {
    console.log('    refreshing... ', env);
    const out = await getConfigByDomain({ ...options, env }, exit)
      .catch(err => error(JSON.stringify(err, err.stack), exit));
    if (out) {
      ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`);
      fs.writeFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, JSON.stringify(out));
    }
    return { env, config: out };
  }));
}

async function updateConfigFromLocal(options, exit) {
  checkProps(['profile', 'env', 'template'], options, 'updateConfigFromLocal');
  const { profile, env, template } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const cloudfront = new AWS.CloudFront();

  ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`);
  const newConfig = JSON.parse(fs.readFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, 'utf8'));
  const etag = await getConfigByDomain(options, exit);


  const promise = cloudfront.updateDistribution({
    DistributionConfig: newConfig, Id: newConfig.Id, IfMatch: etag
  }).promise();
  return promise.then(
    data => data,
    (err) => {
      /* handle the error */
      console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}

async function setup(options) {
  checkProps(['profile', 'domain'], options, 'setup');
  // console.log(options);
  const configs = await refreshLocalConfig(options);
  // console.log(configs);
  return Promise.all(configs.map((obj) => {
    if (!obj.config || !obj.config.Id) {
      return createCloudfrontFromConfig(options, obj.env);
    }
    return Promise.resolve({});
  })).then(() => {
    console.log('    Refreshing and Creation is complete.\n');
  });
}

module.exports = () => {
  const args = minimist(process.argv.slice(2));
  // console.log('cf args', args)

  // check minimum fields
  // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
  // if(!args.hasOwnProperty('root')) error('Must include --root',1)
  if (!args._[1]) error('Must include action', 1);

  // console.log(args);
  const { env, profile } = args;
  const options = getPackage().stackpack;
  // console.log('stackpack options', options);
  // let template = config.template
  // let ssl = config.ssl
  options.profile = profile || options.profile || 'default';
  options.env = env;
  options.cf_envs = options.cf_envs || [];

  const action = args._[1];

  switch (action) {
    case 'refresh':

      refreshLocalConfig(options, 0);
      break;
    case 'setup':
      setup(options);
      break;
    case 'update':
      updateConfigFromLocal(options);
      break;
    case 'get':
      getConfigByDomain(options);
      break;
    case 'invalidate':
      invalidate(options);
      break;
    case 'create':
      createCloudfrontFromConfig(options);
      break;
    default:
      error('Invalid action for cloudfront', 1);
  }
};
