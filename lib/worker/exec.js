var colors = require('colors'),
  es = require('event-stream'),
  exec = require('child_process').exec,
  Output = require('../output');

function maybeEndJob(job) {
  var message;

  job.pending--;
  if (job.pending === 0) {
    message = 'Command exited with code ' + job.exitCode;

    if (job.exitCode === 0) {
      job.output.end(message.bold.green)
    } else  {
      job.output.end(message.bold.red)
    }
  }
}

function makeBoldYellow(chunk, cb) {
  cb(null, chunk.toString().bold.yellow);
}

function queue(id, command) {
  var job = {
    child: exec(command),
    output: Output(),
    exitCode: -1,
    pending: 3
  };

  this.jobs[id] = job;

  job.child.stdout
  .on('end', maybeEndJob.bind(undefined, job))
  .pipe(job.output, {end: false});

  job.child.stderr
  .pipe(es.split())
  .pipe(es.map(makeBoldYellow))
  .pipe(es.join('\n'))
  .on('end', maybeEndJob.bind(undefined, job))
  .pipe(job.output, {end: false});

  job.child.on('exit', function(exitCode) {
    job.exitCode = exitCode;
    maybeEndJob(job);
  });
}

function output(id) {
  return this.jobs[id].output;
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
