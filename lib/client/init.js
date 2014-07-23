var colors = require('colors'),
  fs = require('fs'),
  Q = require('q'),
  run = require('../run.js');

function gitInit(options) {
  return run('git --git-dir=.bran --work-tree=. init', options);
}

function setupIgnore(options) {
  var path = '.bran/info/exclude';

  if (options.verbose) {
    console.error('Writing to %s', path);
  }

  return Q.nfcall(fs.writeFile, path, '.bran')
}

function saveConfig(options) {
  var cmd = 'git --git-dir=.bran config bran.master ' + options.master;
  return run(cmd, options);
}

function setupRemote(options) {
  var cmd = 'git --git-dir=.bran remote add bran http://' +
            options.master + '/repo.git';
  return run(cmd, options);
}

module.exports = function(options) {
  gitInit(options)
    .then(function() {
      return setupIgnore(options);
    })
    .then(function() {
      return saveConfig(options);
    })
    .then(function() {
      return setupRemote(options);
    })
    .fail(function(err) {
      console.error('Error: %s'.bold.red, err.message);
      process.exit(1);
    })
    .done();
};
