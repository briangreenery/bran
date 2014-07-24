var git = require('../git.js');

function queueBuild(ref, options) {
  console.log('POST http://%s/queue-build with %s', options.master, ref);
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
