var colors = require('colors'),
  es = require('event-stream'),
  fs = require('fs'),
  joinPath = require('path').join,
  spawn = require('child_process').spawn;

function writeCommandFile(cb) {
  var name, contents;

  name = 'command_' + (new Date()).getTime();

  if (process.platform === 'win32') {
    contents = '@echo off\r\n' + this.command;

    this.file = joinPath(this.tmpDir, name + '.bat');
    this.cmd = 'cmd.exe';
    this.args = ['/s', '/c', this.file];
  } else {
    contents = this.command;

    this.file = joinPath(this.tmpDir, name + '.sh');
    this.cmd = '/bin/sh';
    this.args = [this.file];
  }

  fs.writeFile(this.file, contents, {mode: parseInt('755', 8)}, cb);
}

function onCommandFileWritten(err) {
  if (err) {
    return this.onError(err);
  }

  if (this.aborted) {
    return this.onError(new Error('Aborted by user'));
  }

  this.spawnProcess(); 
}

function spawnProcess() {
  this.child = spawn(this.cmd, this.args, {cwd: this.workDir});

  this.child.on('error', this.onError);
  this.child.on('exit', this.onExit);

  es.merge(
    this.child.stdout,
    this.child.stderr
      .pipe(es.split())
      .pipe(es.map(boldYellow))
      .pipe(es.join('\n')))
    .pipe(this.output);
}

function onError(err) {
  if (this.done) {
    return;
  }

  this.finalize();
  this.emit('error', err);
}

function onExit(exitCode) {
  if (this.done) {
    return;
  }

  this.finalize();

  if (this.aborted) {
    this.emit('error', new Error('Aborted by user'));
  } else if (exitCode === 0) {
    this.emit('success');
  } else {
    this.emit('error', new Error('Command failed with code ' + exitCode));
  }
}

function finalize() {
  if (this.file) {
    fs.unlink(this.file);
    this.file = null;
  }

  this.done = true;
}

function boldYellow(chunk, cb) {
  cb(null, chunk.toString().bold.yellow);
}

function run() {
  this.output.write(('$ ' + this.command).bold + '\n');
  this.writeCommandFile(this.onCommandFileWritten);
}

function abort() {
  if (this.aborted) {
    return;
  }

  this.aborted = true;

  if (this.child) {
    this.child.kill();
  }
}

function Command(command, tmpDir, workDir) {
  if (!(this instanceof Command)) {
    return new Command(command, tmpDir, workDir);
  }

  this.writeCommandFile = writeCommandFile.bind(this);
  this.onCommandFileWritten = onCommandFileWritten.bind(this);
  this.spawnProcess = spawnProcess.bind(this);
  this.onError = onError.bind(this);
  this.onExit = onExit.bind(this);
  this.finalize = finalize.bind(this);
  this.run = run.bind(this);
  this.abort = abort.bind(this);

  this.command = command;
  this.tmpDir = tmpDir;
  this.workDir = workDir;

  this.aborted = false;
  this.child = null;
  this.done = false;

  this.output = PassThrough();
}

module.exports = Command;
