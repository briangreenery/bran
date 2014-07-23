var colors = require('colors'),
  exec = require('child_process').exec,
  Q = require('q');

module.exports = function(cmd, options) {
  var deferred = Q.defer();

  if (options.verbose) {
    console.error(('$ ' + cmd).bold);
  }

  exec(cmd, function(err, stdout, stderr) {
    var message;

    if (err || options.verbose) {
      if (stdout) {
        console.log(stdout.trim());
      }

      if (stderr) {
        console.error(stderr.trim());
      }
    }

    if (err) {
      message = 'Command "' + cmd + '" failed with code ' + err.code;
      return deferred.reject(new Error(message));
    }

    deferred.resolve(stdout);
  });

  return deferred.promise;
};
