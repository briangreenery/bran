var fatal = require('../fatal.js'),
  git = require('../git.js');

function exec(command, options) {
  console.log('Post ' + command + ' to ' + options.master);
}

module.exports = function(command) {
  options = {
    gitDir: '.bran',
    workTree: '.'
  };

  git.getMaster(options)
    .then(function() {
      return exec(command, options);
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
