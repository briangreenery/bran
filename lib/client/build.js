var run = require('../run.js');

function ignoreErrors(options) {
  return {
    verbose: options.verbose,
    ignoreErrors: true
  }
}

function addAll(options) {
  return run('git --git-dir=.bran add -A .', ignoreErrors(options))
}

function commit(options) {
  return run('git --git-dir=.bran commit -m "start build"',
             ignoreErrors(options))
}

function push(options) {
  return run('git --git-dir=.bran push bran master', options);
}

module.exports = function(options) {
  addAll(options)
    .then(function() {
      return commit(options);
    })
    .then(function() {
      return push(options);
    })
    .fail(function(err) {
      console.error('Error: %s'.bold.red, err.message);
      process.exit(1);
    })
    .done();
}
