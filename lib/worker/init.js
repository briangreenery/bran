var Q = require('q'),
  git = require('../git.js'),
  mkdirp = require('mkdirp');

function createBuildDir(options) {
  return Q.nfcall(mkdirp, options.workTree);
}

function createTmpDir(options) {
  return Q.nfcall(mkdirp, options.tmpDir);
}

function init(options) {
  return createBuildDir(options)
    .then(function() {
      return createTmpDir(options);
    })
    .then(function() {
      return git.init(options);
    });
}

module.exports = init;
