var get = require('./get.js'),
  send = require('./send.js'),
  Writable = require('stream').Writable,
  util = require('util');

function _write(chunk, encoding, done) {
  if (chunk.length + this.length > this.buffer.length) {
    this.growBy(Math.max(this.buffer.length, chunk.length));
  }

  chunk.copy(this.buffer, this.length);
  this.length += chunk.length;

  this.emit('progress');

  done();
  return true;
}

function growBy(amount) {
  var newBuffer = new Buffer(this.buffer.length + amount);
  this.buffer.copy(newBuffer);
  this.buffer = newBuffer;
}

function onFinish() {
  this.finished = true;
  this.emit('progress');
}

function Output(initialCapacity) {
  if (!(this instanceof Output)) {
    return new Output(initialCapacity);
  }

  Writable.call(this);

  this._write = _write.bind(this);
  this.growBy = growBy.bind(this);
  this.onFinish = onFinish.bind(this);

  this.length = 0;
  this.buffer = new Buffer(initialCapacity || 1024);

  this.finished = false;
  this.on('finish', this.onFinish);
}

Output.get = get;
Output.send = send;

util.inherits(Output, Writable);

module.exports = Output;
