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
    } else {
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

function Build() {
  if (!(this instanceof Build)) {
    return new Build();
  }

  this.queue = queue.bind(this);
  this.output = output.bind(this);

  this.jobs = {};
}

module.exports = Build;


var fs = require('fs'),
  git = require('../git.js'),
  joinPath = require('path').join,
  Q = require('q'),
  run = require('./run.js'),
  yaml = require('js-yaml');

function checkoutCommit(options, output) {
  var repo, commands = [];

  repo = 'http://' + options.master + '/repo.git';
  commands.push('git --git-dir="' + options.gitDir + '" fetch ' + repo);

  if (options.clean) {
    commands.push('git --git-dir="' + options.gitDir + '" clean -qfd');
  }

  commands.push(
    'git --git-dir="' + options.gitDir + '" checkout -qf ' + options.commit);

  return run(commands, options, output);
}

function readConfig(options) {
  var options = {encoding: 'utf8'};

  return Q.nfcall(fs.readFile, joinPath(options.workTree, '.bran.yml'), options)
    .then(function(data) {
      return yaml.safeLoad(data);
    });
}

module.exports = function(buildDir, output) {
  var platform = (process.platform === 'win32') ? 'windows' : 'linux';

  return fetchChanges(buildDir, output)
    .then(function() {
      return readConfig(buildDir);
    })
    .then(function(config) {
      return run(config[platform], buildDir, output);
    })
};

var build = require('./build.js'),
  colors = require('colors'),
  es = require('event-stream'),
  EventEmitter = require('events').EventEmitter,
  PassThrough = require('stream').PassThrough,
  util = require('util');

function addPlatform(chunk) {
  var platform = (process.platform === 'win32') ? 'Windows' : 'Linux';
  return ('[' + platform + '] ').bold + chunk;
}

function Job(commit) {
  if (!(this instanceof Job)) {
    return new Job(commit);
  }

  EventEmitter.call(this);

  this.commit = commit;

  this.active = true;
  this.output = "";

  var self = this;
  var inputStream = PassThrough();
  var outputStream = PassThrough();

  build(buildDir, inputStream)
    .then(function() {
      inputStream.write('Build completed successfully'.bold.green);
      inputStream.end();
    })
    .fail(function(err) {
      inputStream.write(err.toString().bold.red);
      inputStream.end();
    })
    .done();

  inputStream
    .pipe(es.split())
    .pipe(es.map(function(chunk, cb) {
      cb(null, addPlatform(chunk));
    }))
    .pipe(es.join('\n'))
    .pipe(outputStream);

  outputStream.on('readable', function() {
    self.output += outputStream.read();
    self.emit('progress');
  });

  outputStream.on('end', function() {
    self.active = false;
    self.output += '\n';
    self.emit('progress');
  });
}

util.inherits(Job, EventEmitter);

module.exports = Job;
