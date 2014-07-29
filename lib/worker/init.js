var Q = require('q'),
  git = require('../git.js'),
  mkdirp = require('mkdirp');

function createBuildDir(options) {
  return Q.nfcall(mkdirp, options.workTree);
}

function init(options) {
  return createBuildDir(options)
    .then(function() {
      return git.init(options);
    });
}

module.exports = init;
