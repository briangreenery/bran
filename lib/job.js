var build = require('./build.js'),
  colors = require('colors'),
  es = require('event-stream'),
  EventEmitter = require('events').EventEmitter,
  PassThrough = require('stream').PassThrough,
  util = require('util');

function Job(buildDir) {
  if (!(this instanceof Job)) {
    return new Job(buildDir);
  }

  EventEmitter.call(this);

  this.active = true;
  this.output = "";

  var self = this;
  var outputStream = PassThrough();
  var platform = (process.platform === 'win32') ? 'Windows' : 'Linux';

  build(buildDir, outputStream)
    .then(function() {
      self.active = false;
      outputStream.write('Build completed successfully\n'.bold.green);
    })
    .fail(function(err) {
      self.active = false;
      outputStream.write((err.toString() + '\n').bold.red);
    })
    .done();

  outputStream.on('readable', function() {
    var line = outputStream.read();

    if (line) {
      self.output += line;
    }
    
    self.emit('progress');
  });
}

util.inherits(Job, EventEmitter);

module.exports = Job;
