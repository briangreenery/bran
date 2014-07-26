var crypto = require('crypto'),
  fatal = require('../fatal.js'),
  format = require('util').format,
  git = require('../git.js'),
  os = require('os'),
  request = require('request');

function makeHash(command) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(command);
  sha1.update((new Date()).getTime().toString());
  sha1.update(os.hostname())
  return sha1.digest('hex');
}

function postCommand(comand, options) {
  var url, body;

  url = format('http://%s/exec', options.master);
  body = {
    id: makeHash(command),
    command: command
  };

  return Q.nfcall(request.post, url, {form: body});
}

function streamOutput(options) {
  var stream, url, deferred;

  deferred = Q.defer();

  url = format('http://%s/exec/%s', options.master, options.id);

  httpStream.get(url)
    .pipe(p)

  stream.pipe(process.stdout);

  stream.on('end', function() {
    deferred.resolve();
  });

  stream.on('error', function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
}

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
