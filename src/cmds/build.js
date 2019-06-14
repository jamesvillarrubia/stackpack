
const shell = require('shelljs');
const minimist = require('minimist');
// const AWS = require('aws-sdk');
// const fs = require('fs');
// const path = require('path');
const getPackage = require('../utils/package').get;
// const error = require('../utils/error');
const ensureDirectoryExistence = require('../utils/dir-exists');


module.exports = async () => {
  const args = minimist(process.argv.slice(2));
  // console.log('cf args', args)

  // check minimum fields
  // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
  // if(!args.hasOwnProperty('root')) error('Must include --root',1)
  // if(!args._[1]) error('Must include action',1)

  // console.log(args);
  const { env } = args;
  const options = getPackage().stackpack;
  // let template = config.template
  // let ssl = config.ssl
  options.env = env;
  // console.log(env);

  ensureDirectoryExistence(`./.stackpack/builds/${env}/`);

  shell.exec(`./node_modules/.bin/env-cmd -f ./.env.${options.env} ./node_modules/.bin/react-scripts build; rm -r ./.stackpack/builds/${env}; mv build ./.stackpack/builds/${env}/`);

  // eslint-disable-next-line no-console
  console.log(`\nBuild created in .stackpack/builds/${env}\n`);
};
