var bodyParser = require('body-parser'),
  BuildQueue = require('./build-queue.js'),
  express = require('express'),
  fatal = require('../fatal.js'),
  init = require('./init.js'),
  Output = require('../output'),
  register = require('./register.js');

function work(options) {
  var app = express(),
    buildQueue = BuildQueue(options);

  app.post('/build', bodyParser.json(), function(req, res) {
    buildQueue.queue(
      req.body.id, req.body.ref, req.body.branch, req.body.clean);
    res.end();
  });

  app.get('/build/:id', function(req, res) {
    var output = buildQueue.output(req.params.id);

    if (output) {
      Output.send(req, res, buildQueue.output(req.params.id));
    } else {
      res.status(404);
      res.end('No build output for ' + req.params.id);
    }
  });

  app.listen(options.port);
}

module.exports = function(options) {
  options.gitDir = 'bran';
  options.tmpDir = 'tmp';

  init(options)
    .then(function() {
      return register(options);
    })
    .then(function() {
      return work(options)
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
