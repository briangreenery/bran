var colors = require('colors'),
  es = require('event-stream'),
  fs = require('fs'),
  joinPath = require('path').join,
  Q = require('q'),
  spawn = require('child_process').spawn,
  util = require('util');

function prepareCommand(tmpDir, command) {
  var result = {};

  result.file = 'command_' + (new Date()).getTime();

  if (process.platform === 'win32') {
    command = '@echo off\r\n' + command;

    result.file = joinPath(tmpDir, result.file + '.bat');
    result.cmd = 'cmd.exe';
    result.args = ['/s', '/c', result.file];
  } else {
    result.file = joinPath(tmpDir, result.file + '.sh');
    result.cmd = '/bin/sh';
    result.args = [result.file];
  }

  return Q.nfcall(fs.writeFile, result.file, command, {mode: 493})
    .then(function() {
      return result;
    });
}

function runCommand(command, cwd, output) {
  var child, file;

  output.write(('$ ' + command).bold + '\n');

  return prepareCommand(process.cwd(), command)
    .then(function(result) {
        var deferred = Q.defer();

        file = result.file;
        child = spawn(result.cmd, result.args, {cwd: cwd});

        child.stdout.pipe(output, {end: false});

        child.stderr
          .pipe(es.split())
          .pipe(es.map(function(chunk, cb) {
            cb(null, chunk.bold.yellow + '\n')
          }))
          .pipe(output, {end: false});

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
    })
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
