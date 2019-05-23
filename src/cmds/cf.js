
const minimist = require('minimist');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const getPackage = require('../utils/package').get;
const error = require('../utils/error');
const defaultConfig = require('../templates/s3-cf-https_default-config.json');
const ensureDirectoryExistence = require('../utils/dir-exists');


function checkProps(array, object) {
  array.forEach((a) => {
    if (!object.hasOwnProperty(a)) {
      error(`Config or flags must include the ${a} property.`);
    }
  });
}


module.exports = () => {
  const args = minimist(process.argv.slice(2));
  // console.log('cf args', args)

  // check minimum fields
  // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
  // if(!args.hasOwnProperty('root')) error('Must include --root',1)
  if (!args._[1]) error('Must include action', 1);

  // console.log(args)
  const { env } = args;
  const options = getPackage().stackpack;
  // let template = config.template
  // let ssl = config.ssl
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

async function setup(options, exit) {
  checkProps(['profile', 'domain', 'env', 'ssl', 'rootenv', 'template'], options);
  const {
    profile, domain, env, ssl, rootenv, template
  } = options;

  const configs = cf_envs.map(env => refreshLocalConfig(profile, domain, env)
    .then((config) => {
      if (!config.Id) {
        return createCloudfrontFromConfig(options, ext)
          .then(config => Promise.resolve({ [env]: config.Id }));
      }
      return Promise.resolve({ [env]: config.Id });
    }));
  return Promise.all(configs)
    .then((configs) => {
      console.log('Cloudfront Setup deploying...');
      console.log(configs);
      return configs;
    });
}

async function invalidate(options, exit) {
  checkProps(['profile', 'env', 'template'], options);
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
      // console.log(data)
      /* process the data */
    },
    (err) => {
      /* handle the error */
      // console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}


async function createCloudfrontFromConfig(options, exit) {
  checkProps(['profile', 'env', 'ssl', 'rootenv', 'template'], options);
  let {
    ssl
  } = options;
  const {
    profile, env, rootenv, template
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
  newConfig.CallerReference = `${env}-${root}`;
  newConfig.Aliases.Items[0] = `${env}-${root}`;
  if (env === rootenv) {
    newConfig.Aliases.Quantity = 2;
    newConfig.Aliases.push(root);
  }
  newConfig.Origins.Items[0].Id = `S3-${env}-${root}`;
  newConfig.Origins.Items[0].DomainName = (`${env}-${root}.s3.amazonaws.com`);
  newConfig.DefaultCacheBehavior.TargetOriginId = `S3-${env}-${root}`;
  if (ssl) {
    newConfig.ViewerCertificate.Certificate = `${ssl}`;
  } else {
    delete newConfig.ViewerCertificate;
    delete newConfig.Aliases;
  }

  // adjust default
  const promise = cloudfront.createDistribution({ DistributionConfig: newConfig }).promise();

  const out = await promise.then(
    data => data.Distribution,
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


function getConfigByDomain(options, exit) {
  checkProps(['profile', 'env'], options);
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
  checkProps(['ssl', 'rootenv', 'template'], options);
  let { env, template, cf_envs } = options;
  // console.log(cf_envs)
  if (env) { cf_envs = [env]; }
  // console.log(cf_envs)
  return cf_envs.map(async (env) => {
    // console.log(env)
    const out = await getConfigByDomain({ ...options, env }, exit).catch(err => error(JSON.stringify(err, err.stack), exit));
    const id = out.Id;
    if (out) {
      ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`);
      fs.writeFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, JSON.stringify(out));
    }
    return out;
  });
}

async function updateConfigFromLocal(options, exit) {
  checkProps(['profile', 'env', 'template'], options);
  const { profile, env, template } = options;
  const credentials = new AWS.SharedIniFileCredentials({ profile });
  AWS.config.credentials = credentials;
  const cloudfront = new AWS.CloudFront();

  ensureDirectoryExistence(`.stackpack/${template}/cloudfront-config-${env}.json`);
  const newConfig = JSON.parse(fs.readFileSync(`.stackpack/${template}/cloudfront-config-${env}.json`, 'utf8'));
  const etag = await getConfigByDomain(options, exit);


  const promise = cloudfront.updateDistribution({ DistributionConfig: newConfig, Id: newConfig.Id, IfMatch: etag }).promise();
  return promise.then(
    data => data,
    (err) => {
      /* handle the error */
      console.log(err, err.stack);
      error(JSON.stringify(err, err.stack), exit);
    }
  ).catch(err => error(JSON.stringify(err, err.stack), exit));
}
