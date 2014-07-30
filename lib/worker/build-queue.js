var Build = require('./build.js');

function queue(id, ref, branch, clean) {
  this.builds[id] = Build(this.options, ref, branch, clean);
  this.buildQueue.push(id);
  this.maybeRunBuild();
}

function abort() {
  if (this.currentBuild) {
    this.currentBuild.abort();
  }
}

function maybeRunBuild() {
  var id;

  if (this.currentBuild) {
    return;
  }

  id = this.buildQueue.shift();

  if (!id) {
    return;
  }

  this.currentBuild = this.builds[id];
  this.currentBuild.run(this.onBuildComplete);
}

function onBuildComplete() {
  this.currentBuild = null;
  this.maybeRunBuild();
}

function output(id) {
  if (this.builds[id]) {
    return this.builds[id].output;
  }

  return null;
}

function BuildQueue(options) {
  if (!(this instanceof BuildQueue)) {
    return new BuildQueue(options);
  }

  this.queue = queue.bind(this);
  this.abort = abort.bind(this);
  this.maybeRunBuild = maybeRunBuild.bind(this);
  this.onBuildComplete = onBuildComplete.bind(this);
  this.output = output.bind(this);

  this.options = options;
  this.builds = {};
  this.currentBuild = null;
  this.buildQueue = [];
}

module.exports = BuildQueue;
