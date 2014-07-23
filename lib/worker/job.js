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

function Job(buildDir) {
  if (!(this instanceof Job)) {
    return new Job(buildDir);
  }

  EventEmitter.call(this);

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
