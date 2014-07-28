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

function Output() {
  if (!(this instanceof Output)) {
    return new Output();
  }

  Writable.call(this);

  this._write = _write.bind(this);
  this.onFinish = onFinish.bind(this);

  this.output = '';
  this.finished = false;

  this.on('finish', this.onFinish);
}

util.inherits(Output, Writable);

module.exports = Output;
