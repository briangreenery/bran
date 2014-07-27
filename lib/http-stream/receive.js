var es = require('event-stream'),
  FibonacciBackoff = require('backoff').fibonacci,
  http = require('http'),
  parseContentRange = require('content-range').parse,
  parseUrl = require('url').parse,
  PassThrough = require('stream').PassThrough;

function createRequest() {
  this.requestOptions.headers.Range = 'bytes=' + this.bytesReceived + '-';

  this.req = http.get(this.requestOptions);
  this.req.on('error', onError.bind(this));
  this.req.on('response', onResponse.bind(this));
}

function onError() { 
  if (this.req) {
    this.req.abort();
    this.req = null;
  }

  this.backoff.backoff();
}

function onResponse(res) {
  if (res.statusCode === 416 && this.bytesReceived === totalLength(res)) {
    this.req.abort();
    this.req = null;
    return this.output.end();
  }

  if (res.statusCode !== 200 && res.statusCode !== 206) {
    return onError.call(this);
  }

  this.backoff.reset();

  res.pipe(es.map(countBytes.bind(this))).pipe(this.output, {end: false});

  if (isLastChunk(res)) {
    res.on('end', endStream.bind(this));
  } else {
    res.on('end', createRequest.bind(this));
  }
}

function countBytes(chunk, cb) {
  this.bytesReceived += chunk.length;
  cb(null, chunk);
}

function totalLength(res) {
  if (!res.headers['content-range']) {
    return null;
  }

  return parseContentRange(res.headers['content-range']).count;
}

function isLastChunk(res) {
  var contentRange;

  if (!res.headers['content-range']) {
    return null;
  }

  contentRange = parseContentRange(res.headers['content-range']);
  return contentRange.end + 1 === contentRange.count;
}

function endStream() {
  this.output.end();
}

function onFailed() {
  var err = new Error('Failed to receive data from server');
  this.output.emit('error', err);
}

function HTTPStream(url) {
  if (!(this instanceof HTTPStream)) {
    return new HTTPStream(url);
  }

  this.req = null;
  this.bytesReceived = 0;
  this.output = PassThrough();

  this.requestOptions = {
    hostname: parseUrl(url).hostname,
    port: parseUrl(url).port,
    path: parseUrl(url).pathname,
    headers: {},
    agent: new http.Agent()
  };

  this.requestOptions.agent.maxSockets = 1;

  this.backoff = FibonacciBackoff();
  this.backoff.failAfter(10);
  this.backoff.on('ready', createRequest.bind(this));
  this.backoff.on('fail', onFailed.bind(this));
  this.backoff.backoff();

  return this.output;
};

module.exports = function(url) {
  return HTTPStream(url);
};
