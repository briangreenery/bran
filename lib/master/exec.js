var Output = require('../output');
  request = require('request');

function queue(id, command, workers) {
  this.jobs[id] = Output();
  this.jobs[id].write('hello');
  this.jobs[id].end();
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
