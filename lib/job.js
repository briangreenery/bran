var build = require('./build.js'),
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

  build(buildDir, outputStream)
    .then(function() {
      self.active = false;
      self.emit('progress');
    })
    .fail(function(err) {
      self.active = false;
      outputStream.write(err.toString() + '\n');
      self.emit('progress');
    })
    .done();

  outputStream.on('readable', function() {
    self.output += outputStream.read();
    self.emit('progress');
  });
}

util.inherits(Job, EventEmitter);

module.exports = Job;
