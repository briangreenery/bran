var colors = require('colors'),
  es = require('event-stream'),
  exec = require('child_process').exec,
  Output = require('../output'),
  util = require('util'),
  yaml = require('js-yaml');

function gitFetch() {
  var command = util.format(
      'git --git-dir="%s" --work-tree="%s" fetch http://%s/repo.git',
      this.gitDir, this.workTree, this.master);

  return this.runCommand(command);
}

function maybeGitClean() {
  if (!this.clean) {
    return;
  }

  var command = util.format(
    'git --git-dir="%s" --work-tree="%s" clean -qfd',
    this.gitDir, this.workTree);

  return this.runCommand(command);
}

function gitCheckout() {
  var command = util.format(
    'git --git-dir="%s" --work-tree="%s" checkout -qf %s',
    this.gitDir, this.workTree, this.ref);

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
  this.output.end('Build succeeded'.bold.green);
}

function onFail(err) {
  this.output.end(('Build failed: ' + err).bold.red);
}

function run() {
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

function start(ref, id) {

}

function output(id) {
  return this.jobs[id].output;
}

function Build(options, id, ref, clean) {
  if (!(this instanceof Build)) {
    return new Build();
  }

  this.start = start.bind(this);
  
  this.output = Output();

  this.name = options.name;
  this.gitDir = options.gitDir;
  this.workTree = options.workTree;
  this.id = id;
  this.ref = ref;
  this.clean = clean;

  this.command = null;
  this.aborted = false;
}

module.exports = Build;
