var colors = require('colors');

module.exports = function(err) {
  console.error('Error: %s'.bold.red, err.message);
  process.exit(1);
};
