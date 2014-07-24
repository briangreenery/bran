var colors = require('colors'),
  fs = require('fs'),
  joinPath = require('path').join,
  Q = require('q'),
  spawn = require('child_process').spawn;

function writeCommandFile(command, options) {
  var mode, result = {};

  result.file = 'command_' + (new Date()).getTime();

  if (process.platform === 'win32') {
    command = '@echo off\r\n' + command;

    result.file = joinPath(options.tmpDir, result.file + '.bat');
    result.cmd = 'cmd.exe';
    result.args = ['/s', '/c', result.file];
  } else {
    result.file = joinPath(options.tmpDir, result.file + '.sh');
    result.cmd = '/bin/sh';
    result.args = [result.file];
  }

  mode = parseInt('755', 8);

  return Q.nfcall(fs.writeFile, result.file, command, {mode: mode});
    .then(function() {
      return result;
    });
}

module.exports = function(command, options) {
  var commandFile;

  options.stdout.write(('$ ' + command).bold + '\n');

  return writeCommandFile(command, options)
    .then(function(result) {
        var child, deferred = Q.defer();

        commandFile = result.file;
        child = spawn(result.cmd, result.args, {cwd: cwd});

        child.stdout.pipe(options.stdout, {end: false});
        child.stderr.pipe(options.stderr, {end: false});

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
    })
    .fin(function() {
      if (file) {
        fs.unlink(file);
      }
    });
};
