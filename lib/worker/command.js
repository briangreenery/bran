var colors = require('colors'),
  es = require('event-stream'),
  fs = require('fs'),
  joinPath = require('path').join,
  PassThrough = require('stream').PassThrough,
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
  this.child.on('close', this.onClose);

  es.merge(
    this.child.stdout,
    this.child.stderr
      .pipe(es.split())
      .pipe(es.map(boldYellow))
      .pipe(es.join('\n')))
    .pipe(this.output, {end: false});
}

function onError(err) {
  if (this.exited) {
    return;
  }

  this.exited = true;

  if (this.file) {
    fs.unlink(this.file);
  }

  if (this.child) {
    this.child.kill();
    this.child.stdout.destroy();
    this.child.stderr.destroy();
  }

  this.output.end();
  this.callback(err);
}

function onClose(exitCode) {
  if (this.exited) {
    return;
  }

  this.exited = true;

  if (this.file) {
    fs.unlink(this.file);
  }

  this.output.end();

  if (this.aborted) {
    this.callback(new Error('Aborted by user'));
  } else if (exitCode === 0) {
    this.callback(null, exitCode);
  } else {
    this.callback(new Error('Command failed with code ' + exitCode));
  }
}

function boldYellow(chunk, callback) {
  callback(null, chunk.toString().bold.yellow);
}

function run(callback) {
  this.callback = callback;
  this.output.write(('$ ' + this.command).bold + '\n');
  this.writeCommandFile(this.onCommandFileWritten);
}

function abort() {
  if (this.aborted || this.exited) {
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
  this.onClose = onClose.bind(this);
  this.run = run.bind(this);
  this.abort = abort.bind(this);

  this.command = command;
  this.tmpDir = tmpDir;
  this.workDir = workDir;

  this.aborted = false;
  this.child = null;
  this.exited = false;

  this.output = PassThrough();
}

module.exports = Command;
