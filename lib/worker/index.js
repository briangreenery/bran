var bodyParser = require('body-parser'),
  Build = require('./build.js'),
  express = require('express'),
  fatal = require('../fatal.js'),
  init = require('./init.js'),
  Output = require('../output'),
  register = require('./register.js');

function work(options) {
  var app = express(),
    build = Build();

  app.post('/exec', bodyParser.json(), function(req, res) {
    build.queue(req.body.id, req.body.ref);
    res.end();
  });

  app.get('/exec/:id', function(req, res) {
    Output.send(req, res, build.output(req.params.id));
  });

  app.listen(options.port);
}

module.exports = function(options) {
  options.gitDir = 'bran';

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
