var colors = require('colors'),
  Q = require('q'),
  spawn = require('child_process').spawn,
  util = require('util');

function runCommand(command, cwd, output) {
  var file, args, child, deferred;

  output.write(('$ ' + command + '\n').bold);

  if (process.platform === 'win32') {
    file = 'cmd.exe';
    args = ['/s', '/c', command];
  } else {
    file = '/bin/sh';
    args = ['-c', command];
  }

  child = spawn(file, args, {cwd: cwd});

  child.stdout.pipe(output, {end: false});
  child.stderr.pipe(output, {end: false});

  deferred = Q.defer();

  child.on('exit', function(code) {
    if (code === 0) {
      deferred.resolve();
    } else {
      deferred.reject(new Error('command failed with code ' + code));
    }
  });

  child.on('error', function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

module.exports = function(commands, cwd, output) {
  if (!util.isArray(commands)) {
    commands = [commands];
  }

  var promise = Q();

  commands.forEach(function(command) {
    promise = promise.then(function() {
      return runCommand(command, cwd, output)
    });
  });

  return promise;
}
