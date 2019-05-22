const minimist = require('minimist')
var AWS = require('aws-sdk');
const error = require('./utils/error')

module.exports = () => {
  const args = minimist(process.argv.slice(2))
//   console.log(args)
    let cmd = args._[0] || 'help'

    if (args.version || args.v) {
      cmd = 'version'
    }
  
    if (args.help || args.h) {
      cmd = 'help'
    }
    switch (cmd) {
      case 'init':
        require('./cmds/init')(args)
        break
      case 'deploy':
        require('./cmds/deploy')(args)
        break
      case 'build':
        require('./cmds/build')(args)
        break
      case 'cf':
        require('./cmds/cf')(args)
        break
      case 'shell':
        require('./cmds/shell')(args)
        break
      default:
        console.error(`"${cmd}" is not a valid command!`)
        break
    }
}
