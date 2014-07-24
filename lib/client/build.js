var git = require('../git.js'),
  request = require('request');

function queueBuild(ref, options) {
  var url, form;

  url = 'http://' + options.master + '/queue-build';
  form = {commit: ref};

  return Q.nfcall(request.post, url, {form: form});
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
  ];

  promise = Q();

  steps.forEach(function(step) {
    promise = promise.then(function() {
      return step(options);
    });
  });

  promise.then(function(ref) {
    return queueBuild(ref, options);
  })
  .fail(function(err) {
    console.error('Error: %s'.bold.red, err.message);
    process.exit(1);
  })
  .done();
}
