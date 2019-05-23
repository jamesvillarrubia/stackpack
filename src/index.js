const minimist = require('minimist');
// const AWS = require('aws-sdk');
// const error = require('./utils/error');

module.exports = () => {
  const args = minimist(process.argv.slice(2));
  //   console.log(args)
  let cmd = args._[0] || 'help';

  if (args.version || args.v) {
    cmd = 'version';
  }

  if (args.help || args.h) {
    cmd = 'help';
  }
  switch (cmd) {
    case 'init':
      require('./cmds/init')(args);//eslint-disable-line 
      break;
    case 'deploy':
      require('./cmds/deploy')(args);//eslint-disable-line 
      break;
    case 'build':
      require('./cmds/build')(args); //eslint-disable-line 
      break;
    case 'cf':
      require('./cmds/cf')(args);//eslint-disable-line 
      break;
    case 'shell':
      require('./cmds/shell')(args);//eslint-disable-line 
      break;
    default:
      console.error(`"${cmd}" is not a valid command!`);//eslint-disable-line 
      break;
  }
};
