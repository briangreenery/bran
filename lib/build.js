var fs = require('fs'),
  joinPath = require('path').join,
  Q = require('q'),
  run = require('./run.js'),
  util = require('util'),
  yaml = require('js-yaml');

function fetchChanges(buildDir, output) {
  var commands = [
    'git clean -qfd',
    'git pull origin master'
  ];

  return run(commands, buildDir, output);
}

function readConfig(buildDir) {
  var options = {encoding: 'utf8'};

  return Q.nfcall(fs.readFile, joinPath(buildDir, '.bran.yml'), options)
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
    .then(function() {
      output.write('Build completed successfully.\n');
    })
};
