var colors = require('colors');
  fs = require('fs'),
  git = require('../git.js'),
  joinPath = require('path').join,
  Q = require('q');

function setIgnore(options) {
  var path = joinPath(options.gitDir, 'info', 'exclude');

  if (options.verbose) {
    console.error('Writing to %s'.bold, path);
  }

  return Q.nfcall(fs.writeFile, path, options.gitDir);
}

module.exports = function(options) {
  var promise, steps;

  options.gitDir = '.bran';
  options.workTree = '.';

  steps = [
    git.init,
    setIgnore,
    git.setMaster,
    git.setUser,
    git.setEmail,
    git.addAll,
    git.commit,
    git.gc
  ];

  promise = Q();

  steps.forEach(function(step) {
    promise = promise.then(function() {
      return step(options);
    });
  });

  promise.fail(function(err) {
    console.error('Error: %s'.bold.red, err.message);
    process.exit(1);
  })
  .done();
};
