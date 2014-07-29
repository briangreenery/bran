var colors = require('colors');

module.exports = function(err) {
  console.error('Error: %s'.bold.red, err);
  process.exit(1);
};
