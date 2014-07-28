var parseRange = require('range-parser'),
  util = require('util');

module.exports = function(req, res, output) {
  var range, start, end;

  if (!req.headers.range) {
    return res.end(buffer);
  }

  range = parseRange(buffer.length, req.headers.range);

  if (!util.isArray(range) || range.length !== 1) {
    res.statusCode = 416;

    if (output.finished) {
      res.setHeader('Content-Range', util.format('bytes */%d', buffer.length));
    }

    return res.end('Requested range not satisfiable');
  }

  start = range[0].start;
  end = range[0].end;

  if (!output.finished) {
    res.setHeader('Content-Range', util.format('bytes %d-%d/*', start, end));
  } else {
    res.setHeader('Content-Range',
                  util.format('bytes %d-%d/%d', start, end, buffer.length));
  }

  if (!output.finished || start !== 0 || end + 1 !== buffer.length) {
    res.statusCode = 206;
  }

  return res.end(buffer.slice(start, end + 1));
}

module.exports.sendPartial = function(req, res, buffer) {
  send(req, res, buffer, true);
};

module.exports.sendComplete = function(req, res, buffer) {
  send(req, res, buffer, false);
};
