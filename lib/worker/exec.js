var colors = require('colors'),
  es = require('event-stream'),
  exec = require('child_process').exec,
  Output = require('../output');

function queue(id, command) {
  var child, output;

  child = exec(command);
  output = Output();

  es.merge(child.stdout, child.stderr).pipe(output);
  this.jobs[id] = output;
}

function output(id) {
  return this.jobs[id];
}

function Exec() {
  if (!(this instanceof Exec)) {
    return new Exec();
  }

  this.queue = queue.bind(this);
  this.output = output.bind(this);

  this.jobs = {};
}

module.exports = Exec;
