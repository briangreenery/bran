var fatal = require('../fatal.js'),
  format = require('util').format,
  git = require('../git.js'),
  Output = require('../output'),
  Q = require('q'),
  request = require('request');

function queueBuild(options) {
  var url, body;

  url = 'http://' + options.master + '/build';
  body = {ref: options.ref};

  return Q.nfcall(request.post, url, {json: body});
}

function streamOutput(options) {
  var url, deferred;

  url = format('http://%s/build/%s', options.master, options.ref);
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

module.exports = function(options) {
  var steps, promise;

  options.gitDir = '.bran';
  options.workTree = '.';

  steps = [
    git.getMaster,
    git.addAll,
    git.commit,
    git.forcePush,
    git.getHeadRef,
    queueBuild,
    streamOutput
  ];

  promise = Q();

  steps.forEach(function(step) {
    promise = promise.then(function() {
      return step(options);
    });
  });

  promise.fail(function(err) {
    fatal(err);
  })
  .done();
}
