var Writable = require('stream').Writable,
  util = require('util');

function _write(chunk, encoding, done) {
  this.output += chunk.toString();
  this.emit('progress');

  done();
  return true;
}

function onFinish() {
  this.finished = true;
  this.emit('progress');
}

function StreamOutput() {
  if (!(this instanceof StreamOutput)) {
    return new StreamOutput();
  }

  Writable.call(this);

  this._write = _write.bind(this);
  this.onFinish = onFinish.bind(this);

  this.output = '';
  this.finished = false;

  this.on('finish', this.onFinish);
}

util.inherits(StreamOutput, Writable);

module.exports = StreamOutput;
