var es = require('event-stream'),
  format = require('util').format,
  Output = require('../output'),
  PassThrough = require('stream').PassThrough,
  Q = require('q'),
  request = require('request');

function addName(name) {
  return es.map(function(line, cb) {
    cb(null, ('[' + name + ']').bold + ' ' + line + '\n');
  });
}

function getWorkerOutput(id, worker) {
  var url = format('http://%s/exec/%s', worker.host, id);
  return Output.get(url);
}

function queueOnWorker(id, command, worker, output) {
  var url, body;

  url = format('http://%s/exec', worker.host);
  body = {
    id: id,
    command: command
  };

  return Q.nfcall(request.post, url, {json: body})
    .then(function() {
      getWorkerOutput(id, worker).on('error', function(err) {
        output.end(('Error: ' + err.message).bold.red);
      }).pipe(output);
    })
    .fail(function(err) {
      output.end(('Error: ' + err.message).bold.red);
    })
    .done();
}

function queue(id, command, workers) {
  var outputs = [];

  workers.forEach(function(worker) {
    var output = es.split();
    queueOnWorker(id, command, worker, output);
    outputs.push(output.pipe(addName(worker.name)));
  });

  this.jobs[id] = Output();
  es.merge.apply(undefined, outputs).pipe(this.jobs[id]);
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
