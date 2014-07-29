var parseRange = require('range-parser'),
  util = require('util');

function sendRange(res, output, start, end) {
  if (output.finished) {
    res.setHeader('Content-Range',
                  util.format('bytes %d-%d/%d', start, end, output.length));
  } else {
    res.setHeader('Content-Range',
                  util.format('bytes %d-%d/*', start, end));
  }

  if (!output.finished || start !== 0 || end + 1 !== output.length) {
    res.statusCode = 206;
  }

  res.end(output.buffer.slice(start, end + 1));  
}

function sendError(res, output) {
  res.statusCode = 416;
  res.setHeader('Content-Range', util.format('bytes */%d', output.length));
  res.end('Requested range not satisfiable');
}

function send(req, res, output) {
  var range;

  if (!req.headers.range) {
    return res.end(output.buffer);
  }

  range = parseRange(output.length, req.headers.range);

  if (util.isArray(range) && range.length === 1) {
    sendRange(res, output, range[0].start, range[0].end);
  } else if (output.finished) {
    sendError(res, output);
  } else {
    output.once('progress', function() {
      send(req, res, output);
    });
  }
}

module.exports = send;
