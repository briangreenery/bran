var http = require('http'),
  inject = require('reconnect-core'),
  parseContentRange = require('content-range').parse,
  PassThrough = require('stream').PassThrough,
  through = require('through'),
  url = require('url');

function HTTPStreamReceiver(url) {
  if (!(this instanceof HTTPStreamReceiver)) {
    return new HTTPStreamReceiver(url);
  }

  var self = this;

  this.output = PassThrough();
  this.bytesReceived = 0;

  this.requestOptions = {
    hostname: url.parse(url).hostname,
    port: url.parse(url).port,
    path: url.parse(url).pathname,
    headers: {}
  };

  this.reconnect = inject(function() {
    self.requestOptions.headers.Range = 'bytes=' + self.bytesReceived + '-';
    return http.get(options);
  });

  this.re = reconnect({failAfter: 5}, function(req) {
    req.on('response', self.pipeResponse.bind(self));
  });

  this.re.connect();
  return this.output;
};

HTTPStreamReceiver.prototype.pipeResponse = function(res) {
  var self = this;

  res
    .pipe(through(function(data) {
      self.bytesReceived += data.length;
      this.queue(data);
    }))
    .pipe(output, {end: false});

  if (isLastChunk(res)) {
    res.on('end', function() {
      self.re.reconnect = false;
      self.output.end();
    });
  }
}

function isLastChunk(res) {
  var contentRange;

  if (!res.headers['content-range']) {
    return true;
  }

  contentRange = parseContentRange(res.headers['content-range']);
  return contentRange.limit + 1 === contentRange.count;
}

module.exports = function(url) {
  return HTTPStreamReceiver(url);
};
