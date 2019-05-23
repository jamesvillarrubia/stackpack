module.exports = (message, exit) => {
  console.error('\n\n', message, '\n\n'); // eslint-disable-line no-console
  exit && process.exit(1); // eslint-disable-line no-unused-expressions
};
