var colors = require('colors');

module.exports = function(err) {
  console.error(err.toString().bold.red);
  process.exit(1);
};
