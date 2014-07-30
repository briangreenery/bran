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

function queueOnWorker(ref, worker) {
  var url, body;

  url = format('http://%s/build', worker.host);
  body = {ref: ref};

  return Q.nfcall(request.post, url, {json: body});
}

function getWorkerOutput(ref, worker) {
  var url = format('http://%s/build/%s', worker.host, ref);
  return Output.get(url);
}

function buildOnWorker(ref, worker, output) {
  queueOnWorker(ref, worker)
    .then(function() {
      getWorkerOutput(ref, worker)
        .on('error', function(err) {
          output.end(err.toString().bold.red);
        })
        .pipe(output);
    })
    .fail(function(err) {
      console.log('Failing: ' + err);
      output.end(err.toString().bold.red);
    })
    .done();
}

function queue(ref, workers) {
  var outputs = [];

  workers.forEach(function(worker) {
    var output, taggedOutput;

    output = PassThrough();

    taggedOutput = output
      .pipe(es.split())
      .pipe(es.map(addWorkerName(worker.name)));

    outputs.push(taggedOutput);
    buildOnWorker(ref, worker, output);
  });

  this.jobs[ref] = Output();
  es.merge.apply(undefined, outputs).pipe(this.jobs[ref]);
}

function output(ref) {
  return this.jobs[ref];
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
