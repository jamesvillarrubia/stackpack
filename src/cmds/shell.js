const shell = require('shelljs');
const minimist = require('minimist');
const childProcess = require('child_process');
const error = require('../utils/error');
const getPackage = require('../utils/package').get;
// const AWS = require('aws-sdk');
// const fs = require('fs');
// const path = require('path');
// const defaultConfig = require('../templates/s3-cf-https_default-config.json');
// const paths = require('../utils/paths');
// const ensureDirectoryExistence = require('../utils/dir-exists');

function run(action, options) {
  // var str = shell.cat(`./shells/${action}.sh`);
  const path = require('path'); // eslint-disable-line global-require
  const modulesShellsPath = path.resolve(__dirname, '../shells');
  childProcess.execFileSync(`${modulesShellsPath}/${action}.sh`, [options[1], options[2], options[3], options[4]], { stdio: 'inherit' });
}

function checkGit() {
  if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
  }
}


module.exports = () => {
  const args = minimist(process.argv.slice(2));
  // console.log('cf args', args)

  // check minimum fields
  // if(!args.hasOwnProperty('profile')) error('Must include --profile', 1)
  // if(!args.hasOwnProperty('root')) error('Must include --root',1)
  if (!args._[1]) error('Must include action', 1);
  // if(args._[1] !== 'setup' && !args.hasOwnProperty('env')) error('Must include --env',1)

  const { env } = args;
  const action = args._[1];
  const options = getPackage().stackpack;
  options.env = env;
  options.profile = options.aws_profile;
  options.module = options.module_name;
  options.root = options.aws_bucket_root;
  options.cf_envs = options.cf_envs || [];
  options.rootenv = options.root_env;
  // console.log(paths.resolveApp('node_modules/stackpack/shells'))
  // console.log(process.cwd())

  switch (action) {
    case 'aws-deploy':
      run(action, {
        ...options, 1: options.profile || '', 2: options.root || '', 3: options.env || ''
      });
      break;
    case 'dockerize':
      run(action, options);
      break;
    case 'generate-robots':
      run(action, options);
      break;
    case 'git-tools':
      run(action, { ...options, 1: args._[2] });
      break;
    case 'semver':
      run(action, options);
      break;
    case 'test':
      run(action, options);
      break;
    case 'version-prompt':
      checkGit();
      run(action, options);
      break;
    case 'gitlab-skip':
      run('gitlab-skip', {
        ...options, 1: options.profile, 2: options.root, 3: options.env
      });
      break;
    default:
      error('Invalid action for shell', 1);
  }
};
