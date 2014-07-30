var es = require('event-stream'),
  format = require('util').format,
  Output = require('../output'),
  PassThrough = require('stream').PassThrough,
  Q = require('q'),
  request = require('request');

function addWorkerName(name) {
  var tag = ('[' + name + ']').bold + ' ';

  return function(line, cb) {
    cb(null, tag + line + '\n');
  };
}

function queueOnWorker(id, ref, branch, clean, worker) {
  var url, body;

  url = format('http://%s/build', worker.host);
  body = {id: id, ref: ref, branch: branch, clean: clean};

  return Q.nfcall(request.post, url, {json: body});
}

function getWorkerOutput(id, worker) {
  var url = format('http://%s/build/%s', worker.host, id);
  return Output.get(url);
}

function buildOnWorker(id, ref, branch, clean, worker, output) {
  queueOnWorker(id, ref, branch, clean, worker)
    .then(function() {
      getWorkerOutput(id, worker)
        .on('error', function(err) {
          output.end(err.toString().bold.red);
        })
        .pipe(output);
    })
    .fail(function(err) {
      output.end(err.toString().bold.red);
    })
    .done();
}

function queue(id, ref, branch, clean, workers) {
  var outputs = [];

  workers.forEach(function(worker) {
    var output, taggedOutput;

    output = PassThrough();

    taggedOutput = output
      .pipe(es.split())
      .pipe(es.map(addWorkerName(worker.name)));

    outputs.push(taggedOutput);
    buildOnWorker(id, ref, branch, clean, worker, output);
  });

  this.jobs[id] = Output();
  es.merge.apply(undefined, outputs).pipe(this.jobs[id]);
}

function output(id) {
  return this.jobs[id];
}

function Build() {
  if (!(this instanceof Build)) {
    return new Build();
  }

  this.queue = queue.bind(this);
  this.output = output.bind(this);

  this.jobs = {};
}

module.exports = Build;
