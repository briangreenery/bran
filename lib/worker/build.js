var colors = require('colors'),
  Command = require('./command.js'),
  es = require('event-stream'),
  exec = require('child_process').exec,
  fs = require('fs'),
  joinPath = require('path').join,
  Output = require('../output'),
  Q = require('q'),
  util = require('util'),
  yaml = require('js-yaml');

function gitFetch() {
  var command = util.format(
    'git --git-dir="%s" --work-tree="%s" fetch http://%s/repo.git %s',
    this.gitDir,
    this.workTree,
    this.master,
    this.branch);

  return this.runCommand(command);
}

function maybeGitClean() {
  if (!this.clean) {
    return;
  }

  var command = util.format('git --git-dir="%s" --work-tree="%s" clean -qfd',
                            this.gitDir,
                            this.workTree);

  return this.runCommand(command);
}

function gitCheckout() {
  var command =
    util.format('git --git-dir="%s" --work-tree="%s" checkout -qf %s',
                this.gitDir,
                this.workTree,
                this.ref);

  return this.runCommand(command);
}

function readConfig() {
  return Q.nfcall(fs.readFile, joinPath(this.workTree, '.bran.yml'));
}

function parseConfig(file) {
  return yaml.safeLoad(file);
}

function executeBuild(config) {
  var self, promise, steps;

  self = this;
  steps = config[this.name];

  if (!util.isArray(steps)) {
    steps = [steps];
  }

  promise = Q();

  steps.forEach(function(step) {
    promise = promise.then(function() {
      return self.runCommand(step);
    });
  });

  return promise;
}

function runCommand(command) {
  if (this.aborted) {
    throw new Error('Aborted by user');
  }

  this.command = Command(command, this.tmpDir, this.workDir);
  this.command.output.pipe(this.output, {end: false});
  return Q.nfcall(this.command.run);
}

function onSuccess() {
  this.finished = true;
  this.output.end('Build succeeded'.bold.green);
  this.callback();
}

function onFail(err) {
  this.finished = true;
  this.output.end(('Build failed: ' + err).bold.red);
  this.callback();
}

function run(callback) {
  this.callback = callback;

  return Q()
    .then(this.gitFetch)
    .then(this.maybeGitClean)
    .then(this.gitCheckout)
    .then(this.readConfig)
    .then(this.parseConfig)
    .then(this.executeBuild)
    .then(this.onSuccess)
    .fail(this.onFail)
    .done();
}

function abort() {
  this.aborted = true;

  if (this.command) {
    this.command.abort();
    this.command = null;
  }
}

function Build(options, ref, branch, clean) {
  if (!(this instanceof Build)) {
    return new Build(options, ref, branch, clean);
  }

  this.gitFetch = gitFetch.bind(this);
  this.maybeGitClean = maybeGitClean.bind(this);
  this.gitCheckout = gitCheckout.bind(this);
  this.readConfig = readConfig.bind(this);
  this.parseConfig = parseConfig.bind(this);
  this.executeBuild = executeBuild.bind(this);
  this.runCommand = runCommand.bind(this);
  this.onSuccess = onSuccess.bind(this);
  this.onFail = onFail.bind(this);
  this.run = run.bind(this);
  this.abort = abort.bind(this);

  this.name = options.name;
  this.master = options.master;
  this.gitDir = options.gitDir;
  this.workTree = options.workTree;
  this.tmpDir = options.tmpDir;
  this.ref = ref;
  this.branch = branch;
  this.clean = clean;

  this.output = Output();
  this.command = null;
  this.aborted = false;
  this.finished = false;
}

module.exports = Build;
