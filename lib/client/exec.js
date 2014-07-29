var crypto = require('crypto'),
  fatal = require('../fatal.js'),
  format = require('util').format,
  git = require('../git.js'),
  os = require('os'),
  Output = require('../output'),
  Q = require('q'),
  request = require('request');

function makeHash(command) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(command);
  sha1.update((new Date()).getTime().toString());
  sha1.update(os.hostname())
  return sha1.digest('hex');
}

function postCommand(options) {
  var url, body;

  url = format('http://%s/exec', options.master);

  body = {
    id: options.id,
    command: options.command
  };

  return Q.nfcall(request.post, url, {json: body});
}

function streamOutput(options) {
  var url, deferred;

  url = format('http://%s/exec/%s', options.master, options.id);
  deferred = Q.defer();

  Output.get(url)
    .on('end', function() {
      deferred.resolve();
    })
    .on('error', function(err) {
      deferred.reject(err);
    })
    .pipe(process.stdout);

  return deferred.promise;
}

function exec(command, options) {
  console.log('Post ' + command + ' to ' + options.master);
}

module.exports = function(command) {
  var options = {
    gitDir: '.bran',
    workTree: '.',
    command: command,
    id: makeHash(command)
  };

  git.getMaster(options)
    .then(function() {
      return postCommand(options);
    })
    .then(function() {
      return streamOutput(options);
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
