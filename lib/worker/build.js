var colors = require('colors'),
  fs = require('fs'),
  joinPath = require('path').join,
  Q = require('q'),
  run = require('./run.js'),
  util = require('util'),
  yaml = require('js-yaml');

function checkoutCommit(options, output) {
  var repo, commands = [];

  repo = 'http://' + options.master + '/repo.git';
  commands.push('git --git-dir="' + options.gitDir + '" fetch ' + repo);

  if (options.clean) {
    commands.push('git --git-dir="' + options.gitDir + '" clean -qfd');
  }

  commands.push(
    'git --git-dir="' + options.gitDir + '" checkout -qf ' + options.commit);

  return run(commands, options, output);
}

function readConfig(options) {
  var options = {encoding: 'utf8'};

  return Q.nfcall(fs.readFile, joinPath(options.workTree, '.bran.yml'), options)
    .then(function(data) {
      return yaml.safeLoad(data);
    });
}

module.exports = function(buildDir, output) {
  var platform = (process.platform === 'win32') ? 'windows' : 'linux';

  return fetchChanges(buildDir, output)
    .then(function() {
      return readConfig(buildDir);
    })
    .then(function(config) {
      return run(config[platform], buildDir, output);
    })
};
