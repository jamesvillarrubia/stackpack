module.exports = (message, exit) => {
    console.error('\n\n',message,'\n\n')
    exit && process.exit(1)
  }