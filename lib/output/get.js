var es = require('event-stream'),
  FibonacciBackoff = require('backoff').fibonacci,
  http = require('http'),
  parseContentRange = require('content-range').parse,
  parseUrl = require('url').parse,
  PassThrough = require('stream').PassThrough;

function createRequest() {
  this.requestOptions.headers.Range = 'bytes=' + this.bytesReceived + '-';

  this.req = http.get(this.requestOptions);
  this.req.on('error', this.onError);
  this.req.on('response', this.onResponse);
}

function onError(err) { 
  if (this.req) {
    this.req.abort();
    this.req = null;
  }

  this.backoff.backoff(err);
}

function onResponse(res) {
  if (res.statusCode === 416 && this.bytesReceived === totalLength(res)) {
    this.req.abort();
    this.req = null;
    return this.output.end();
  }

  if (res.statusCode !== 200 && res.statusCode !== 206) {
    return this.onError(new Error('Bad status code: ' + res.statusCode));
  }

  this.backoff.reset();

  if (isLastChunk(res)) {
    res.pipe(this.output);
  } else {
    res.pipe(es.map(this.countBytes)).pipe(this.output, {end: false});
    res.on('end', this.createRequest);
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
    return false;
  }

  contentRange = parseContentRange(res.headers['content-range']);
  return contentRange.end + 1 === contentRange.count;
}

function onFail(err) {
  this.output.emit('error', err);
}

function HTTPStream(url) {
  if (!(this instanceof HTTPStream)) {
    return new HTTPStream(url);
  }

  this.createRequest = createRequest.bind(this);
  this.onError = onError.bind(this);
  this.onResponse = onResponse.bind(this);
  this.countBytes = countBytes.bind(this);
  this.onFail = onFail.bind(this);

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
  this.backoff.on('ready', this.createRequest);
  this.backoff.on('fail', this.onFail);

  this.createRequest();
  return this.output;
}

module.exports = function(url) {
  return HTTPStream(url);
};
